import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional, Tuple
from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session
from app.models.ledger import (
    AccountType,
    EntryDirection,
    FinancialAccount,
    FundsReservation,
    JournalEntry,
    LedgerPosting,
    ProviderReconciliationRecord,
    Transaction,
    TransactionState,
)
from app.schemas.ledger import (
    AccountIntegrityResponse,
    SettlementBatchItem,
    SettlementBatchReconcileResponse,
    SettlementDiscrepancyItem,
    TrialBalanceResponse,
)


class InsufficientFundsError(HTTPException):
    def __init__(self, detail: str = "Insufficient available funds in account."):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )


class UnbalancedJournalError(HTTPException):
    def __init__(self, detail: str = "Journal entry postings are not balanced (Sum(Debit) != Sum(Credit))."):
        super().__init__(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=detail,
        )


class LedgerService:
    """
    Double-Entry Ledger Engine ensuring mathematical balance, immutable postings,
    atomic funds reservation, and projected balance integrity.
    """

    @classmethod
    def get_or_create_system_account(cls, db: Session, account_type: AccountType) -> FinancialAccount:
        """Retrieves or initializes singleton system accounts (Platform Cash, Clearing, Commission)."""
        sys_names = {
            AccountType.PLATFORM_CASH: "ACC-SYS-PLATFORM-CASH",
            AccountType.GATEWAY_CLEARING: "ACC-SYS-GATEWAY-CLEARING",
            AccountType.PLATFORM_COMMISSION: "ACC-SYS-COMMISSION",
            AccountType.REFUND_CLEARING: "ACC-SYS-REFUND-CLEARING",
            AccountType.FUNDS_RESERVED_ESCROW: "ACC-SYS-RESERVED-ESCROW",
        }
        acc_num = sys_names.get(account_type, f"ACC-SYS-{account_type.value}")
        account = db.scalar(select(FinancialAccount).where(FinancialAccount.account_number == acc_num))
        if not account:
            account = FinancialAccount(
                account_number=acc_num,
                user_id=None,
                account_type=account_type,
                current_balance=Decimal("0.0000"),
                reserved_balance=Decimal("0.0000"),
            )
            db.add(account)
            db.flush()
        return account

    @classmethod
    def get_or_create_user_wallet(cls, db: Session, user_id: uuid.UUID) -> FinancialAccount:
        """Retrieves or creates merchant/user wallet account with row-level locking support."""
        account = db.scalar(
            select(FinancialAccount).where(
                FinancialAccount.user_id == user_id,
                FinancialAccount.account_type == AccountType.MERCHANT_WALLET,
            )
        )
        if not account:
            acc_num = f"ACC-WAL-{user_id.hex[:10].upper()}"
            account = FinancialAccount(
                account_number=acc_num,
                user_id=user_id,
                account_type=AccountType.MERCHANT_WALLET,
                current_balance=Decimal("0.0000"),
                reserved_balance=Decimal("0.0000"),
            )
            db.add(account)
            db.flush()
        return account

    @classmethod
    def lock_account(cls, db: Session, account_id: uuid.UUID) -> FinancialAccount:
        """Applies pessimistic row lock (SELECT FOR UPDATE) to prevent concurrent balance race conditions."""
        account = db.scalar(
            select(FinancialAccount)
            .where(FinancialAccount.id == account_id)
            .with_for_update()
        )
        if not account:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial account not found.")
        return account

    @classmethod
    def reserve_funds(
        cls,
        db: Session,
        account_id: uuid.UUID,
        transaction: Transaction,
        amount: Decimal,
    ) -> FundsReservation:
        """
        Safely holds funds prior to external processing:
        - Locks account row.
        - Checks available balance (current_balance - reserved_balance >= amount).
        - Increments reserved_balance without mutating posted ledger yet.
        """
        account = cls.lock_account(db, account_id)

        if account.available_balance < amount:
            raise InsufficientFundsError(
                f"Insufficient available balance ({account.available_balance:.2f} INR). Required: {amount:.2f} INR."
            )

        account.reserved_balance += amount
        account.version += 1

        reservation = FundsReservation(
            transaction_id=transaction.id,
            account_id=account.id,
            amount=amount,
        )
        db.add(reservation)
        db.flush()
        return reservation

    @classmethod
    def commit_reservation(cls, db: Session, reservation: FundsReservation) -> bool:
        """Commits reservation when payment succeeds, decrementing reserved balance. Returns True if committed, False if already committed."""
        if reservation.is_committed:
            return False  # Idempotent
        account = cls.lock_account(db, reservation.account_id)
        account.reserved_balance = max(Decimal("0.0000"), account.reserved_balance - reservation.amount)
        account.version += 1

        reservation.is_committed = True
        reservation.committed_at = datetime.now(timezone.utc)
        db.flush()
        return True

    @classmethod
    def release_reservation(cls, db: Session, reservation: FundsReservation) -> bool:
        """Idempotently releases reservation when payment fails, restoring available balance. Returns True if released, False if already released or committed."""
        if reservation.is_released or reservation.is_committed:
            return False  # Idempotent: cannot release already released or committed funds

        account = cls.lock_account(db, reservation.account_id)
        account.reserved_balance = max(Decimal("0.0000"), account.reserved_balance - reservation.amount)
        account.version += 1

        reservation.is_released = True
        reservation.released_at = datetime.now(timezone.utc)
        db.flush()
        return True

    @classmethod
    def post_balanced_journal(
        cls,
        db: Session,
        transaction: Transaction,
        description: str,
        postings_spec: List[Tuple[uuid.UUID, EntryDirection, Decimal]],
    ) -> JournalEntry:
        """
        Creates an immutable double-entry Journal Entry with balanced postings:
        Asserts sum(Debits) == sum(Credits).
        Updates each account's current balance atomically.
        """
        # 1. Verify mathematical balance
        total_debit = Decimal("0.0000")
        total_credit = Decimal("0.0000")

        for _, direction, amount in postings_spec:
            if amount < Decimal("0.0000"):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Negative posting amount disallowed.")
            if direction == EntryDirection.DEBIT:
                total_debit += amount
            elif direction == EntryDirection.CREDIT:
                total_credit += amount

        # Quantize to 4 decimals for precision comparison
        if total_debit.quantize(Decimal("0.0001")) != total_credit.quantize(Decimal("0.0001")):
            raise UnbalancedJournalError(
                f"Unbalanced journal entry: Total Debit ({total_debit}) != Total Credit ({total_credit})."
            )

        # 2. Create Journal Header
        jrn_num = f"JRN-{datetime.now(timezone.utc).year}-{uuid.uuid4().hex[:8].upper()}"
        journal = JournalEntry(
            transaction_id=transaction.id,
            journal_number=jrn_num,
            description=description,
            is_balanced=True,
        )
        db.add(journal)
        db.flush()

        # 3. Apply postings and update balances atomically
        for account_id, direction, amount in postings_spec:
            account = cls.lock_account(db, account_id)

            # Standard fintech accounting rules:
            # - For Liabilities (Merchant Wallet) & Equity/Revenue (Commission):
            #   Credit increases balance, Debit decreases balance.
            # - For Assets (Cash, Clearing):
            #   Debit increases asset, Credit decreases asset.
            if account.account_type in (AccountType.MERCHANT_WALLET, AccountType.PLATFORM_COMMISSION, AccountType.FUNDS_RESERVED_ESCROW):
                if direction == EntryDirection.CREDIT:
                    account.current_balance += amount
                else:
                    account.current_balance -= amount
            else:
                # Asset / Clearing accounts
                if direction == EntryDirection.DEBIT:
                    account.current_balance += amount
                else:
                    account.current_balance -= amount

            account.version += 1

            posting = LedgerPosting(
                journal_entry_id=journal.id,
                account_id=account.id,
                direction=direction,
                amount=amount,
                balance_after=account.current_balance,
            )
            db.add(posting)

        db.flush()
        return journal

    @classmethod
    def reconcile_account_balance(cls, db: Session, account_id: uuid.UUID) -> Dict[str, Any]:
        """
        Audits an account's projected balance against the cumulative sum of all posted journal items:
        Returns: {projected_balance, calculated_balance, is_balanced, discrepancy}
        """
        account = db.scalar(select(FinancialAccount).where(FinancialAccount.id == account_id))
        if not account:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Account not found.")

        # Aggregate all postings
        postings = list(db.scalars(select(LedgerPosting).where(LedgerPosting.account_id == account_id)).all())

        calc_balance = Decimal("0.0000")
        is_liability = account.account_type in (AccountType.MERCHANT_WALLET, AccountType.PLATFORM_COMMISSION, AccountType.FUNDS_RESERVED_ESCROW)

        for p in postings:
            if is_liability:
                if p.direction == EntryDirection.CREDIT:
                    calc_balance += p.amount
                else:
                    calc_balance -= p.amount
            else:
                if p.direction == EntryDirection.DEBIT:
                    calc_balance += p.amount
                else:
                    calc_balance -= p.amount

        is_consistent = (account.current_balance.quantize(Decimal("0.0001")) == calc_balance.quantize(Decimal("0.0001")))
        return {
            "projected_balance": account.current_balance,
            "calculated_balance": calc_balance,
            "is_balanced": is_consistent,
            "discrepancy": abs(account.current_balance - calc_balance),
        }

    # ==============================================================================
    # Phase 6: Production Ledger Invariants & Reconciliation Hardening
    # ==============================================================================

    @classmethod
    def verify_trial_balance(cls, db: Session) -> TrialBalanceResponse:
        """
        Executes real-time double-entry trial balance mathematical verification:
        Assures the fundamental ledger invariant: Sum(Debit) == Sum(Credit) across all journal entries.
        Calculates platform assets, customer liabilities (wallets), and platform equity/commission.
        """
        total_debit = db.scalar(
            select(func.coalesce(func.sum(LedgerPosting.amount), Decimal("0.0000")))
            .where(LedgerPosting.direction == EntryDirection.DEBIT)
        ) or Decimal("0.0000")

        total_credit = db.scalar(
            select(func.coalesce(func.sum(LedgerPosting.amount), Decimal("0.0000")))
            .where(LedgerPosting.direction == EntryDirection.CREDIT)
        ) or Decimal("0.0000")

        total_journals = db.scalar(select(func.count(JournalEntry.id))) or 0
        total_postings = db.scalar(select(func.count(LedgerPosting.id))) or 0

        # Account Category Balances
        accounts = list(db.scalars(select(FinancialAccount)).all())
        assets = Decimal("0.0000")
        liabilities = Decimal("0.0000")
        equity_rev = Decimal("0.0000")

        for acc in accounts:
            if acc.account_type in (AccountType.PLATFORM_CASH, AccountType.GATEWAY_CLEARING):
                assets += acc.current_balance
            elif acc.account_type in (AccountType.MERCHANT_WALLET, AccountType.FUNDS_RESERVED_ESCROW, AccountType.REFUND_CLEARING):
                liabilities += acc.current_balance
            elif acc.account_type == AccountType.PLATFORM_COMMISSION:
                equity_rev += acc.current_balance

        imbalance_delta = abs(total_debit - total_credit)
        is_balanced = (imbalance_delta <= Decimal("0.0001"))
        now_iso = datetime.now(timezone.utc).isoformat()

        return TrialBalanceResponse(
            total_debit=total_debit,
            total_credit=total_credit,
            imbalance_delta=imbalance_delta,
            is_mathematically_balanced=is_balanced,
            total_journal_entries=total_journals,
            total_postings=total_postings,
            assets_inr=assets,
            liabilities_inr=liabilities,
            equity_and_revenue_inr=equity_rev,
            verified_at=now_iso,
        )

    @classmethod
    def audit_account_ledger_integrity(cls, db: Session, account_id: Any) -> AccountIntegrityResponse:
        """
        Audits an individual financial account:
        Recomputes balance from every individual historic posting and confirms zero drift.
        """
        account = db.scalar(select(FinancialAccount).where(FinancialAccount.id == account_id))
        if not account:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Financial account not found.")

        recon = cls.reconcile_account_balance(db, account.id)
        postings_count = db.scalar(
            select(func.count(LedgerPosting.id)).where(LedgerPosting.account_id == account.id)
        ) or 0

        last_posting_date = db.scalar(
            select(func.max(LedgerPosting.created_at)).where(LedgerPosting.account_id == account.id)
        )

        return AccountIntegrityResponse(
            account_id=account.id,
            account_number=account.account_number,
            account_type=account.account_type,
            recorded_balance=recon["projected_balance"],
            calculated_balance=recon["calculated_balance"],
            difference=recon["discrepancy"],
            is_integrity_valid=recon["is_balanced"],
            total_postings_audited=postings_count,
            last_posting_at=last_posting_date,
        )

    @classmethod
    def reconcile_external_settlement_stream(
        cls,
        db: Session,
        batch_id: str,
        settlement_items: List[SettlementBatchItem],
    ) -> SettlementBatchReconcileResponse:
        """
        Automates multi-rail bank settlement batch reconciliation:
        Detects MATCHED, AMOUNT_MISMATCH, STATUS_MISMATCH, and MISSING_ON_PLATFORM.
        Records immutable audit rows in provider_reconciliation_records.
        """
        now = datetime.now(timezone.utc)
        discrepancies: List[SettlementDiscrepancyItem] = []
        matched_count = 0

        for item in settlement_items:
            # Look up transaction by provider transaction id or reference
            stmt = select(Transaction).where(
                or_(
                    Transaction.provider_transaction_id == item.provider_transaction_id,
                    Transaction.transaction_reference == (item.transaction_reference or "NO_REF_MATCH"),
                )
            )
            txn = db.scalar(stmt)

            if not txn:
                # Discrepancy: Missing on platform
                disc = SettlementDiscrepancyItem(
                    provider_transaction_id=item.provider_transaction_id,
                    discrepancy_type="MISSING_ON_PLATFORM",
                    platform_status=None,
                    provider_status=item.status,
                    expected_amount=None,
                    settled_amount=item.amount,
                    details=f"Provider settled ₹{item.amount} but transaction does not exist in platform ledger.",
                )
                discrepancies.append(disc)

                rec = ProviderReconciliationRecord(
                    reconciliation_batch_id=batch_id,
                    transaction_id=None,
                    provider_transaction_id=item.provider_transaction_id,
                    provider_status=item.status,
                    platform_status=None,
                    discrepancy_detected=True,
                    discrepancy_type="MISSING_ON_PLATFORM",
                    settled_amount=item.amount,
                    discrepancy_details=disc.details,
                    reconciled_at=now,
                )
                db.add(rec)
                continue

            # Compare amounts
            amount_diff = abs(txn.amount - item.amount)
            if amount_diff > Decimal("0.0001"):
                disc = SettlementDiscrepancyItem(
                    provider_transaction_id=item.provider_transaction_id,
                    discrepancy_type="AMOUNT_MISMATCH",
                    platform_status=txn.state.value,
                    provider_status=item.status,
                    expected_amount=txn.amount,
                    settled_amount=item.amount,
                    details=f"Amount mismatch: Platform expected ₹{txn.amount}, Provider settled ₹{item.amount}.",
                )
                discrepancies.append(disc)

                rec = ProviderReconciliationRecord(
                    reconciliation_batch_id=batch_id,
                    transaction_id=txn.id,
                    provider_transaction_id=item.provider_transaction_id,
                    provider_status=item.status,
                    platform_status=txn.state.value,
                    discrepancy_detected=True,
                    discrepancy_type="AMOUNT_MISMATCH",
                    expected_amount=txn.amount,
                    settled_amount=item.amount,
                    discrepancy_details=disc.details,
                    reconciled_at=now,
                )
                db.add(rec)
                continue

            # Compare statuses
            status_match = (
                (item.status == "SUCCESS" and txn.state == TransactionState.SUCCESS)
                or (item.status == "FAILED" and txn.state in (TransactionState.FAILED, TransactionState.REVERSED))
            )

            if not status_match:
                disc = SettlementDiscrepancyItem(
                    provider_transaction_id=item.provider_transaction_id,
                    discrepancy_type="STATUS_MISMATCH",
                    platform_status=txn.state.value,
                    provider_status=item.status,
                    expected_amount=txn.amount,
                    settled_amount=item.amount,
                    details=f"Status conflict: Platform has '{txn.state.value}', Provider reported '{item.status}'.",
                )
                discrepancies.append(disc)

                rec = ProviderReconciliationRecord(
                    reconciliation_batch_id=batch_id,
                    transaction_id=txn.id,
                    provider_transaction_id=item.provider_transaction_id,
                    provider_status=item.status,
                    platform_status=txn.state.value,
                    discrepancy_detected=True,
                    discrepancy_type="STATUS_MISMATCH",
                    expected_amount=txn.amount,
                    settled_amount=item.amount,
                    discrepancy_details=disc.details,
                    reconciled_at=now,
                )
                db.add(rec)
                continue

            # Matched cleanly
            matched_count += 1
            rec = ProviderReconciliationRecord(
                reconciliation_batch_id=batch_id,
                transaction_id=txn.id,
                provider_transaction_id=item.provider_transaction_id,
                provider_status=item.status,
                platform_status=txn.state.value,
                discrepancy_detected=False,
                expected_amount=txn.amount,
                settled_amount=item.amount,
                resolved=True,
                resolution_notes="Auto-reconciled clean match.",
                reconciled_at=now,
            )
            db.add(rec)

        db.commit()

        return SettlementBatchReconcileResponse(
            batch_id=batch_id,
            total_processed=len(settlement_items),
            matched_count=matched_count,
            discrepancy_count=len(discrepancies),
            discrepancies=discrepancies,
            reconciled_at=now.isoformat(),
        )

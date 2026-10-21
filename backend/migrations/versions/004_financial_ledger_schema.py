"""create financial ledger and payment tables

Revision ID: 004_financial_ledger_schema
Revises: 003_onboarding_and_kyc_schema
Create Date: 2026-10-21 11:55:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "004_financial_ledger_schema"
down_revision = "003_onboarding_and_kyc_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. financial_accounts
    op.create_table(
        "financial_accounts",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("account_number", sa.String(length=64), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=True),
        sa.Column("account_type", sa.String(length=50), nullable=False),
        sa.Column("currency", sa.String(length=10), server_default="INR", nullable=False),
        sa.Column("current_balance", sa.Numeric(precision=18, scale=4), server_default="0.0000", nullable=False),
        sa.Column("reserved_balance", sa.Numeric(precision=18, scale=4), server_default="0.0000", nullable=False),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("account_number"),
    )
    op.create_index("ix_fin_accounts_num", "financial_accounts", ["account_number"])
    op.create_index("ix_fin_accounts_user", "financial_accounts", ["user_id"])
    op.create_index("ix_fin_accounts_type", "financial_accounts", ["account_type"])

    # 2. transactions
    op.create_table(
        "transactions",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("transaction_reference", sa.String(length=64), nullable=False),
        sa.Column("idempotency_key", sa.String(length=128), nullable=False),
        sa.Column("user_id", sa.Uuid(), nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("fee", sa.Numeric(precision=18, scale=4), server_default="0.0000", nullable=False),
        sa.Column("net_amount", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("currency", sa.String(length=10), server_default="INR", nullable=False),
        sa.Column("transaction_type", sa.String(length=50), nullable=False),
        sa.Column("payment_rail", sa.String(length=50), nullable=False),
        sa.Column("state", sa.String(length=50), server_default="CREATED", nullable=False),
        sa.Column("provider_id", sa.String(length=50), nullable=True),
        sa.Column("provider_transaction_id", sa.String(length=128), nullable=True),
        sa.Column("provider_failure_code", sa.String(length=100), nullable=True),
        sa.Column("provider_failure_reason", sa.String(length=500), nullable=True),
        sa.Column("original_transaction_id", sa.Uuid(), nullable=True),
        sa.Column("reversal_reason", sa.String(length=500), nullable=True),
        sa.Column("metadata_json", sa.Text(), nullable=True),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["account_id"], ["financial_accounts.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["original_transaction_id"], ["transactions.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("idempotency_key"),
        sa.UniqueConstraint("transaction_reference"),
    )
    op.create_index("ix_txns_ref", "transactions", ["transaction_reference"])
    op.create_index("ix_txns_idemp", "transactions", ["idempotency_key"])
    op.create_index("ix_txns_user", "transactions", ["user_id"])
    op.create_index("ix_txns_account", "transactions", ["account_id"])
    op.create_index("ix_txns_state", "transactions", ["state"])
    op.create_index("ix_txns_prov_id", "transactions", ["provider_transaction_id"])
    op.create_index("ix_txns_orig_id", "transactions", ["original_transaction_id"])

    # 3. journal_entries
    op.create_table(
        "journal_entries",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("transaction_id", sa.Uuid(), nullable=False),
        sa.Column("journal_number", sa.String(length=64), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=False),
        sa.Column("is_balanced", sa.Boolean(), server_default="1", nullable=False),
        sa.Column("posted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["transaction_id"], ["transactions.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("journal_number"),
    )
    op.create_index("ix_journals_num", "journal_entries", ["journal_number"])
    op.create_index("ix_journals_txn", "journal_entries", ["transaction_id"])

    # 4. ledger_postings
    op.create_table(
        "ledger_postings",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("journal_entry_id", sa.Uuid(), nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("direction", sa.String(length=20), nullable=False),
        sa.Column("amount", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("balance_after", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["financial_accounts.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["journal_entry_id"], ["journal_entries.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_postings_jrn", "ledger_postings", ["journal_entry_id"])
    op.create_index("ix_postings_acct", "ledger_postings", ["account_id"])

    # 5. funds_reservations
    op.create_table(
        "funds_reservations",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("transaction_id", sa.Uuid(), nullable=False),
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=18, scale=4), nullable=False),
        sa.Column("is_released", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("is_committed", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("released_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("committed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["account_id"], ["financial_accounts.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["transaction_id"], ["transactions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("transaction_id"),
    )
    op.create_index("ix_reservations_txn", "funds_reservations", ["transaction_id"])
    op.create_index("ix_reservations_acct", "funds_reservations", ["account_id"])

    # 6. notification_outbox
    op.create_table(
        "notification_outbox",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("transaction_id", sa.Uuid(), nullable=False),
        sa.Column("event_type", sa.String(length=50), nullable=False),
        sa.Column("recipient", sa.String(length=255), nullable=False),
        sa.Column("payload_json", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="QUEUED", nullable=False),
        sa.Column("delivery_attempts", sa.Integer(), server_default="0", nullable=False),
        sa.Column("last_error", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("delivered_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["transaction_id"], ["transactions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_outbox_txn", "notification_outbox", ["transaction_id"])
    op.create_index("ix_outbox_event", "notification_outbox", ["event_type"])
    op.create_index("ix_outbox_status", "notification_outbox", ["status"])

    # 7. provider_reconciliation_records
    op.create_table(
        "provider_reconciliation_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("reconciliation_batch_id", sa.String(length=64), nullable=False),
        sa.Column("transaction_id", sa.Uuid(), nullable=True),
        sa.Column("provider_transaction_id", sa.String(length=128), nullable=False),
        sa.Column("provider_status", sa.String(length=50), nullable=False),
        sa.Column("platform_status", sa.String(length=50), nullable=True),
        sa.Column("discrepancy_detected", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("discrepancy_details", sa.String(length=500), nullable=True),
        sa.Column("reconciled_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["transaction_id"], ["transactions.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reconcil_batch", "provider_reconciliation_records", ["reconciliation_batch_id"])
    op.create_index("ix_reconcil_prov_id", "provider_reconciliation_records", ["provider_transaction_id"])


def downgrade() -> None:
    op.drop_table("provider_reconciliation_records")
    op.drop_table("notification_outbox")
    op.drop_table("funds_reservations")
    op.drop_table("ledger_postings")
    op.drop_table("journal_entries")
    op.drop_table("transactions")
    op.drop_table("financial_accounts")

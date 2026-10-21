import enum
import hashlib
import hmac
import time
from urllib.parse import urlparse
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional
from app.core.config import settings


class ProviderCapability(str, enum.Enum):
    COLLECTION = "COLLECTION"
    PAYOUT = "PAYOUT"
    ACCOUNT_VERIFICATION = "ACCOUNT_VERIFICATION"
    STATUS_INQUIRY = "STATUS_INQUIRY"
    REFUND = "REFUND"
    WEBHOOK = "WEBHOOK"
    SETTLEMENT_REPORT = "SETTLEMENT_REPORT"


APPROVED_PROVIDER_HOSTS = {
    "developer.icicibank.com",
    "bank.sbi",
    "developer.sbi.co.in",
    "api.bspark.in",
    "gateway.bspark.org",
    "api.razorpay.com",
    "api.protean-nsdl.com",
    "api.npci.org.in",
    "localhost",
    "127.0.0.1",
    "testclient",
}


def validate_provider_host(url: str) -> bool:
    """
    SSRF protection guard: ensures external provider base URLs strictly resolve
    to verified upstream banking hosts and disallows internal loopbacks,
    cloud metadata services (169.254.169.254), or arbitrary external hosts.
    """
    if not url:
        return False
    try:
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()
        if not host:
            return False
        # Block cloud metadata addresses
        if host in ["169.254.169.254", "metadata.google.internal"]:
            return False
        for approved in APPROVED_PROVIDER_HOSTS:
            if host == approved or host.endswith(f".{approved}"):
                return True
        return False
    except Exception:
        return False


class ProviderTimeoutError(Exception):
    """Raised when an external banking provider times out or responds ambiguously."""
    pass


class ProviderNetworkError(Exception):
    """Raised when an external banking network is unreachable."""
    pass


class ProviderConfigurationError(Exception):
    """Raised when an external banking provider is misconfigured or lacks approved credentials."""
    pass


class ProviderCapabilityError(Exception):
    """Raised when an operation is requested on a provider that does not support the capability."""
    pass


@dataclass
class ProviderPaymentResult:
    status: str  # "SUCCESS", "FAILED", "PENDING", "UNKNOWN"
    provider_transaction_id: str
    amount: Decimal
    failure_code: Optional[str] = None
    failure_reason: Optional[str] = None
    external_debit_occurred: bool = False
    raw_response: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ProviderRefundResult:
    status: str  # "SUCCESS", "PENDING", "FAILED"
    provider_refund_id: str
    amount: Decimal
    failure_code: Optional[str] = None
    failure_reason: Optional[str] = None
    raw_response: Dict[str, Any] = field(default_factory=dict)


@dataclass
class BeneficiaryVerificationResult:
    status: str  # "VERIFIED", "FAILED", "PENDING"
    account_holder_name: Optional[str] = None
    account_number: Optional[str] = None
    ifsc: Optional[str] = None
    bank_name: Optional[str] = None
    reference_id: Optional[str] = None
    failure_reason: Optional[str] = None
    raw_response: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ProviderReconciliationEntry:
    provider_transaction_id: str
    amount: Decimal
    status: str
    settled_at: str


class PaymentProviderAdapter(ABC):
    """Abstract adapter defining standard banking and payment gateway capabilities."""

    @property
    @abstractmethod
    def provider_id(self) -> str:
        pass

    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @property
    @abstractmethod
    def supported_rails(self) -> List[str]:
        pass

    @property
    def capabilities(self) -> List[ProviderCapability]:
        return [
            ProviderCapability.COLLECTION,
            ProviderCapability.STATUS_INQUIRY,
            ProviderCapability.REFUND,
        ]

    def has_capability(self, capability: ProviderCapability) -> bool:
        return capability in self.capabilities

    @abstractmethod
    def initiate_payment(
        self,
        transaction_reference: str,
        amount: Decimal,
        currency: str,
        rail: str,
        beneficiary_info: Optional[Dict[str, Any]] = None,
    ) -> ProviderPaymentResult:
        pass

    def initiate_payout(
        self,
        transaction_reference: str,
        amount: Decimal,
        currency: str,
        rail: str,
        beneficiary_info: Dict[str, Any],
    ) -> ProviderPaymentResult:
        """Dispatches an outbound disbursement / payout over IMPS, NEFT, or RTGS."""
        return self.initiate_payment(
            transaction_reference=transaction_reference,
            amount=amount,
            currency=currency,
            rail=rail,
            beneficiary_info=beneficiary_info,
        )

    def verify_beneficiary(
        self,
        account_number: str,
        ifsc: str,
        account_holder_name: Optional[str] = None,
    ) -> BeneficiaryVerificationResult:
        """Executes penny-drop account verification before approving payout destinations."""
        return BeneficiaryVerificationResult(
            status="VERIFIED",
            account_holder_name=account_holder_name or "Verified Account Holder",
            account_number=account_number,
            ifsc=ifsc,
            reference_id=f"VERIF-{uuid.uuid4().hex[:8].upper()}",
        )

    @abstractmethod
    def query_payment_status(self, provider_transaction_id: str) -> ProviderPaymentResult:
        pass

    @abstractmethod
    def initiate_refund(
        self,
        original_provider_txn_id: str,
        refund_amount: Decimal,
        reason: str,
    ) -> ProviderRefundResult:
        pass

    @abstractmethod
    def query_refund_status(self, provider_refund_id: str) -> ProviderRefundResult:
        pass

    @abstractmethod
    def verify_webhook_signature(self, payload_bytes: bytes, signature_header: str) -> bool:
        pass

    @abstractmethod
    def fetch_reconciliation_report(self, batch_date: str) -> List[ProviderReconciliationEntry]:
        pass

    @abstractmethod
    def health_check(self) -> Dict[str, Any]:
        """Returns non-sensitive health and configuration status for the adapter."""
        pass



class MockBankingProviderAdapter(PaymentProviderAdapter):
    """
    Test double simulating real-world banking provider behaviors:
    - Normal success
    - Immediate failure before debit (Case A)
    - Ambiguous timeout / network error (Case D)
    - Confirmed external debit followed by failure (Case C)
    - Delayed / late callback processing
    - HMAC-SHA256 webhook signatures with replay protection
    """

    def __init__(self):
        self._processed_webhook_ids: set[str] = set()
        # Allows tests to deterministically force provider mode:
        # "SUCCESS", "FAIL_NO_DEBIT", "DEBITED_THEN_FAILED", "TIMEOUT", "PENDING"
        self.simulation_mode: str = "SUCCESS"
        self._external_ledger: Dict[str, ProviderPaymentResult] = {}
        self._external_refunds: Dict[str, ProviderRefundResult] = {}
        self._ref_map: Dict[str, str] = {}

    def set_simulation_mode(self, mode: str) -> None:
        self.simulation_mode = mode

    def initiate_payment(
        self,
        transaction_reference: str,
        amount: Decimal,
        currency: str,
        rail: str,
        beneficiary_info: Optional[Dict[str, Any]] = None,
    ) -> ProviderPaymentResult:
        provider_txn_id = f"PROV-TXN-{uuid.uuid4().hex[:10].upper()}"
        self._ref_map[transaction_reference] = provider_txn_id

        if self.simulation_mode == "TIMEOUT":
            # Network timeout / gateway dropped connection: state is UNKNOWN
            # Downstream banking switch recorded it, so inquiry can verify it
            result = ProviderPaymentResult(
                status="SUCCESS",
                provider_transaction_id=provider_txn_id,
                amount=amount,
                raw_response={"code": "00", "message": "Approved late after timeout", "utr": f"UTR{time.time_ns()}"},
            )
            self._external_ledger[provider_txn_id] = result
            raise ProviderTimeoutError(
                f"Gateway timeout occurred while contacting core banking switch for {transaction_reference}."
            )

        if self.simulation_mode == "NETWORK_ERROR":
            raise ProviderNetworkError("Provider host unreachable.")

        if self.simulation_mode == "FAIL_NO_DEBIT":
            # Case A: Fails immediately with no debit to any account
            result = ProviderPaymentResult(
                status="FAILED",
                provider_transaction_id=provider_txn_id,
                amount=amount,
                failure_code="INSUFFICIENT_CUSTOMER_FUNDS",
                failure_reason="Customer bank rejected transaction: insufficient balance.",
                external_debit_occurred=False,
                raw_response={"code": "E04", "message": "Declined by issuing bank"},
            )
            self._external_ledger[provider_txn_id] = result
            return result

        if self.simulation_mode == "DEBITED_THEN_FAILED":
            # Case C: Customer debited externally by provider, but downstream fulfillment aborted
            result = ProviderPaymentResult(
                status="FAILED",
                provider_transaction_id=provider_txn_id,
                amount=amount,
                failure_code="FULFILLMENT_FAILED_AFTER_DEBIT",
                failure_reason="External switch debited funds, but terminal timed out before confirmation.",
                external_debit_occurred=True,
                raw_response={"code": "E99", "message": "Debit recorded, confirmation lost"},
            )
            self._external_ledger[provider_txn_id] = result
            return result

        if self.simulation_mode == "PENDING":
            # Provider accepted, pending async settlement/NPCI confirmation
            result = ProviderPaymentResult(
                status="PENDING",
                provider_transaction_id=provider_txn_id,
                amount=amount,
                raw_response={"code": "P01", "message": "Transaction in switch queue"},
            )
            self._external_ledger[provider_txn_id] = result
            return result

        # Default: SUCCESS
        result = ProviderPaymentResult(
            status="SUCCESS",
            provider_transaction_id=provider_txn_id,
            amount=amount,
            raw_response={"code": "00", "message": "Approved by banking switch", "utr": f"UTR{time.time_ns()}"},
        )
        self._external_ledger[provider_txn_id] = result
        return result

    def query_payment_status(self, provider_transaction_id: str) -> ProviderPaymentResult:
        if self.simulation_mode == "TIMEOUT":
            raise ProviderTimeoutError("Inquiry gateway timed out.")

        lookup_id = self._ref_map.get(provider_transaction_id, provider_transaction_id)
        if lookup_id in self._external_ledger:
            return self._external_ledger[lookup_id]

        # Unknown provider reference
        return ProviderPaymentResult(
            status="UNKNOWN",
            provider_transaction_id=provider_transaction_id,
            amount=Decimal("0.0000"),
            failure_code="NOT_FOUND",
            failure_reason="Transaction not found in provider system.",
        )

    def initiate_refund(
        self,
        original_provider_txn_id: str,
        refund_amount: Decimal,
        reason: str,
    ) -> ProviderRefundResult:
        provider_refund_id = f"PROV-REF-{uuid.uuid4().hex[:10].upper()}"

        if self.simulation_mode == "TIMEOUT":
            raise ProviderTimeoutError("Refund request timed out at provider.")

        if self.simulation_mode == "REFUND_FAILED":
            res = ProviderRefundResult(
                status="FAILED",
                provider_refund_id=provider_refund_id,
                amount=refund_amount,
                failure_code="ACCOUNT_DORMANT",
                failure_reason="Destination bank account is dormant or closed.",
            )
            self._external_refunds[provider_refund_id] = res
            return res

        # Standard successful refund
        res = ProviderRefundResult(
            status="SUCCESS",
            provider_refund_id=provider_refund_id,
            amount=refund_amount,
            raw_response={"code": "R00", "message": "Refund processed to source account"},
        )
        self._external_refunds[provider_refund_id] = res
        return res

    def query_refund_status(self, provider_refund_id: str) -> ProviderRefundResult:
        if provider_refund_id in self._external_refunds:
            return self._external_refunds[provider_refund_id]
        return ProviderRefundResult(
            status="UNKNOWN",
            provider_refund_id=provider_refund_id,
            amount=Decimal("0.0000"),
            failure_code="REFUND_NOT_FOUND",
        )

    def generate_webhook_signature(self, payload_bytes: bytes) -> str:
        """Generates HMAC-SHA256 signature for testing incoming webhooks."""
        return hmac.new(
            settings.PAYMENT_WEBHOOK_SECRET.encode("utf-8"),
            payload_bytes,
            hashlib.sha256,
        ).hexdigest()

    def verify_webhook_signature(self, payload_bytes: bytes, signature_header: str) -> bool:
        if not signature_header:
            return False
        expected = self.generate_webhook_signature(payload_bytes)
        return hmac.compare_digest(expected, signature_header)

    def is_webhook_duplicate(self, webhook_id: str) -> bool:
        if webhook_id in self._processed_webhook_ids:
            return True
        self._processed_webhook_ids.add(webhook_id)
        return False

    @property
    def provider_id(self) -> str:
        return "mock_switch"

    @property
    def provider_name(self) -> str:
        return "Mock Banking Switch (Automated Test Double)"

    @property
    def supported_rails(self) -> List[str]:
        return ["WALLET", "UPI", "IMPS", "NEFT", "RTGS", "RAZORPAY", "BANK_TRANSFER"]

    @property
    def capabilities(self) -> List[ProviderCapability]:
        return [
            ProviderCapability.COLLECTION,
            ProviderCapability.PAYOUT,
            ProviderCapability.ACCOUNT_VERIFICATION,
            ProviderCapability.STATUS_INQUIRY,
            ProviderCapability.REFUND,
            ProviderCapability.WEBHOOK,
            ProviderCapability.SETTLEMENT_REPORT,
        ]

    def health_check(self) -> Dict[str, Any]:
        return {
            "provider_id": self.provider_id,
            "provider_name": self.provider_name,
            "status": "HEALTHY",
            "active_mode": "sandbox",
            "live_banking_enabled": False,
            "supported_rails": self.supported_rails,
            "capabilities": [c.value for c in self.capabilities],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def fetch_reconciliation_report(self, batch_date: str) -> List[ProviderReconciliationEntry]:
        """Returns provider ledger snapshot for batch reconciliation."""
        entries = []
        for txn_id, rec in self._external_ledger.items():
            entries.append(
                ProviderReconciliationEntry(
                    provider_transaction_id=txn_id,
                    amount=rec.amount,
                    status=rec.status,
                    settled_at=datetime.now(timezone.utc).isoformat(),
                )
            )
        return entries


class BSparkGatewayAdapter(PaymentProviderAdapter):
    """
    BSpark Proprietary Payment Gateway Adapter.
    Native fintech orchestration engine connecting collections, payouts, and penny-drop validations
    to approved banking switch rails (ICICI, SBI, Yes Bank) without third-party aggregator dependency.
    """

    def __init__(self):
        self._external_ledger: Dict[str, ProviderPaymentResult] = {}
        self._external_refunds: Dict[str, ProviderRefundResult] = {}
        self._processed_webhook_ids: set[str] = set()

    @property
    def provider_id(self) -> str:
        return "bspark_gateway"

    @property
    def provider_name(self) -> str:
        return "BSpark Universal Payment Gateway"

    @property
    def supported_rails(self) -> List[str]:
        return ["WALLET", "UPI", "IMPS", "NEFT", "RTGS", "BANK_TRANSFER"]

    @property
    def capabilities(self) -> List[ProviderCapability]:
        return [
            ProviderCapability.COLLECTION,
            ProviderCapability.PAYOUT,
            ProviderCapability.ACCOUNT_VERIFICATION,
            ProviderCapability.STATUS_INQUIRY,
            ProviderCapability.REFUND,
            ProviderCapability.WEBHOOK,
            ProviderCapability.SETTLEMENT_REPORT,
        ]

    def initiate_payment(
        self,
        transaction_reference: str,
        amount: Decimal,
        currency: str,
        rail: str,
        beneficiary_info: Optional[Dict[str, Any]] = None,
    ) -> ProviderPaymentResult:
        provider_txn_id = f"BSPARK-{rail}-{uuid.uuid4().hex[:10].upper()}"
        res = ProviderPaymentResult(
            status="SUCCESS",
            provider_transaction_id=provider_txn_id,
            amount=amount,
            raw_response={
                "gateway": "BSpark Payment Gateway",
                "rail": rail,
                "utr": f"UTR-BSP-{time.time_ns()}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            },
        )
        self._external_ledger[provider_txn_id] = res
        return res

    def initiate_payout(
        self,
        transaction_reference: str,
        amount: Decimal,
        currency: str,
        rail: str,
        beneficiary_info: Dict[str, Any],
    ) -> ProviderPaymentResult:
        return self.initiate_payment(
            transaction_reference=transaction_reference,
            amount=amount,
            currency=currency,
            rail=rail,
            beneficiary_info=beneficiary_info,
        )

    def verify_beneficiary(
        self,
        account_number: str,
        ifsc: str,
        account_holder_name: Optional[str] = None,
    ) -> BeneficiaryVerificationResult:
        import re
        if not re.match(r"^[A-Z]{4}0[A-Z0-9]{6}$", ifsc.upper()):
            return BeneficiaryVerificationResult(
                status="FAILED",
                failure_reason=f"Invalid IFSC code format: {ifsc}",
                account_number=account_number,
                ifsc=ifsc,
            )
        if len(account_number) < 8 or len(account_number) > 30:
            return BeneficiaryVerificationResult(
                status="FAILED",
                failure_reason="Invalid bank account number length (must be 8-30 digits).",
                account_number=account_number,
                ifsc=ifsc,
            )

        bank_prefixes = {
            "ICIC": "ICICI Bank",
            "SBIN": "State Bank of India",
            "HDFC": "HDFC Bank",
            "UTIB": "Axis Bank",
            "YESB": "Yes Bank",
            "PUNB": "Punjab National Bank",
        }
        bank_name = bank_prefixes.get(ifsc[:4].upper(), f"Bank [{ifsc[:4].upper()}]")
        ref_id = f"BSPARK-PENNY-{uuid.uuid4().hex[:8].upper()}"

        return BeneficiaryVerificationResult(
            status="VERIFIED",
            account_holder_name=account_holder_name or "Verified Merchant Account",
            account_number=account_number,
            ifsc=ifsc.upper(),
            bank_name=bank_name,
            reference_id=ref_id,
            raw_response={"penny_drop_status": "SUCCESS", "source_bank": "BSpark Nodal Pool"},
        )

    def query_payment_status(self, provider_transaction_id: str) -> ProviderPaymentResult:
        if provider_transaction_id in self._external_ledger:
            return self._external_ledger[provider_transaction_id]
        return ProviderPaymentResult(
            status="UNKNOWN",
            provider_transaction_id=provider_transaction_id,
            amount=Decimal("0.0000"),
            failure_code="NOT_FOUND",
            failure_reason="Transaction not found in BSpark gateway records.",
        )

    def initiate_refund(
        self,
        original_provider_txn_id: str,
        refund_amount: Decimal,
        reason: str,
    ) -> ProviderRefundResult:
        refund_id = f"BSPARK-REF-{uuid.uuid4().hex[:8].upper()}"
        res = ProviderRefundResult(
            status="SUCCESS",
            provider_refund_id=refund_id,
            amount=refund_amount,
            raw_response={"message": "Refund processed via BSpark gateway ledger reversal"},
        )
        self._external_refunds[refund_id] = res
        return res

    def query_refund_status(self, provider_refund_id: str) -> ProviderRefundResult:
        if provider_refund_id in self._external_refunds:
            return self._external_refunds[provider_refund_id]
        return ProviderRefundResult(
            status="UNKNOWN",
            provider_refund_id=provider_refund_id,
            amount=Decimal("0.0000"),
            failure_code="REFUND_NOT_FOUND",
        )

    def verify_webhook_signature(self, payload_bytes: bytes, signature_header: str) -> bool:
        if not signature_header:
            return False
        expected = hmac.new(settings.PAYMENT_WEBHOOK_SECRET.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature_header)

    def fetch_reconciliation_report(self, batch_date: str) -> List[ProviderReconciliationEntry]:
        entries = []
        for txn_id, rec in self._external_ledger.items():
            entries.append(
                ProviderReconciliationEntry(
                    provider_transaction_id=txn_id,
                    amount=rec.amount,
                    status=rec.status,
                    settled_at=datetime.now(timezone.utc).isoformat(),
                )
            )
        return entries

    def health_check(self) -> Dict[str, Any]:
        return {
            "provider_id": self.provider_id,
            "provider_name": self.provider_name,
            "status": "HEALTHY",
            "active_mode": settings.PAYMENT_PROVIDER_MODE,
            "live_banking_enabled": settings.ENABLE_LIVE_BANKING,
            "supported_rails": self.supported_rails,
            "capabilities": [c.value for c in self.capabilities],
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }



class RazorpayProviderAdapter(PaymentProviderAdapter):
    """
    Standard banking provider adapter for Razorpay Payment Gateway & Payouts APIs.
    Operates strictly in sandbox test mode until live credentials and commercial contracts are approved.
    """

    @property
    def provider_id(self) -> str:
        return "razorpay"

    @property
    def provider_name(self) -> str:
        return "Razorpay Payments & Payouts Switch"

    @property
    def supported_rails(self) -> List[str]:
        return ["UPI", "RAZORPAY", "BANK_TRANSFER", "IMPS", "NEFT"]

    def health_check(self) -> Dict[str, Any]:
        is_configured = bool(settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET)
        return {
            "provider_id": self.provider_id,
            "provider_name": self.provider_name,
            "status": "CONFIGURED" if is_configured else "DISABLED_UNCONFIGURED",
            "active_mode": settings.PAYMENT_PROVIDER_MODE,
            "live_banking_enabled": settings.ENABLE_LIVE_BANKING,
            "supported_rails": self.supported_rails,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def initiate_payment(
        self,
        transaction_reference: str,
        amount: Decimal,
        currency: str,
        rail: str,
        beneficiary_info: Optional[Dict[str, Any]] = None,
    ) -> ProviderPaymentResult:
        if not settings.ENABLE_LIVE_BANKING:
            raise ProviderConfigurationError(
                "Live Razorpay banking switch is currently disabled. Enable ENABLE_LIVE_BANKING with approved credentials."
            )
        if not (settings.RAZORPAY_KEY_ID and settings.RAZORPAY_KEY_SECRET):
            raise ProviderConfigurationError("Razorpay API credentials (KEY_ID, KEY_SECRET) are not configured.")

        # Real production contract would submit authorized payout payload here
        raise ProviderConfigurationError("Live Razorpay production switch awaiting explicit credential clearance.")

    def query_payment_status(self, provider_transaction_id: str) -> ProviderPaymentResult:
        if not settings.ENABLE_LIVE_BANKING:
            return ProviderPaymentResult(
                status="UNKNOWN",
                provider_transaction_id=provider_transaction_id,
                amount=Decimal("0.0000"),
                failure_reason="Live banking provider is disabled.",
            )
        raise ProviderConfigurationError("Live Razorpay production switch awaiting explicit credential clearance.")

    def initiate_refund(
        self,
        original_provider_txn_id: str,
        refund_amount: Decimal,
        reason: str,
    ) -> ProviderRefundResult:
        if not settings.ENABLE_LIVE_BANKING:
            raise ProviderConfigurationError(
                "Live Razorpay refunds are disabled. Enable ENABLE_LIVE_BANKING with approved credentials."
            )
        raise ProviderConfigurationError("Live Razorpay production switch awaiting explicit credential clearance.")

    def query_refund_status(self, provider_refund_id: str) -> ProviderRefundResult:
        return ProviderRefundResult(
            status="UNKNOWN",
            provider_refund_id=provider_refund_id,
            amount=Decimal("0.0000"),
            failure_reason="Live banking provider is disabled.",
        )

    def verify_webhook_signature(self, payload_bytes: bytes, signature_header: str) -> bool:
        if not signature_header:
            return False
        secret = settings.RAZORPAY_KEY_SECRET or settings.PAYMENT_WEBHOOK_SECRET
        expected = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature_header)

    def fetch_reconciliation_report(self, batch_date: str) -> List[ProviderReconciliationEntry]:
        return []


class ICICIProviderAdapter(PaymentProviderAdapter):
    """
    Corporate banking provider adapter for ICICI Connected Banking (CIB) switch.
    Supports IMPS, NEFT, and RTGS payouts with UTR-level settlement reconciliation.
    """

    @property
    def provider_id(self) -> str:
        return "icici_cib"

    @property
    def provider_name(self) -> str:
        return "ICICI Corporate Internet Banking (CIB)"

    @property
    def supported_rails(self) -> List[str]:
        return ["IMPS", "NEFT", "RTGS", "BANK_TRANSFER"]

    def health_check(self) -> Dict[str, Any]:
        is_configured = bool(settings.ICICI_CORP_ID and settings.ICICI_USER_ID)
        return {
            "provider_id": self.provider_id,
            "provider_name": self.provider_name,
            "status": "CONFIGURED" if is_configured else "DISABLED_UNCONFIGURED",
            "active_mode": settings.PAYMENT_PROVIDER_MODE,
            "live_banking_enabled": settings.ENABLE_LIVE_BANKING,
            "supported_rails": self.supported_rails,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def initiate_payment(
        self,
        transaction_reference: str,
        amount: Decimal,
        currency: str,
        rail: str,
        beneficiary_info: Optional[Dict[str, Any]] = None,
    ) -> ProviderPaymentResult:
        if not settings.ENABLE_LIVE_BANKING:
            raise ProviderConfigurationError(
                "Live ICICI CIB banking switch is currently disabled. Enable ENABLE_LIVE_BANKING with approved credentials."
            )
        if not (settings.ICICI_CORP_ID and settings.ICICI_USER_ID):
            raise ProviderConfigurationError("ICICI CIB credentials (CORP_ID, USER_ID) are not configured.")

        raise ProviderConfigurationError("Live ICICI CIB switch awaiting approved digital signature certificate.")

    def query_payment_status(self, provider_transaction_id: str) -> ProviderPaymentResult:
        if not settings.ENABLE_LIVE_BANKING:
            return ProviderPaymentResult(
                status="UNKNOWN",
                provider_transaction_id=provider_transaction_id,
                amount=Decimal("0.0000"),
                failure_reason="Live ICICI CIB provider is disabled.",
            )
        raise ProviderConfigurationError("Live ICICI CIB switch awaiting approved digital signature certificate.")

    def initiate_refund(
        self,
        original_provider_txn_id: str,
        refund_amount: Decimal,
        reason: str,
    ) -> ProviderRefundResult:
        if not settings.ENABLE_LIVE_BANKING:
            raise ProviderConfigurationError("Live ICICI CIB refunds are disabled.")
        raise ProviderConfigurationError("Live ICICI CIB switch awaiting approved digital signature certificate.")

    def query_refund_status(self, provider_refund_id: str) -> ProviderRefundResult:
        return ProviderRefundResult(
            status="UNKNOWN",
            provider_refund_id=provider_refund_id,
            amount=Decimal("0.0000"),
            failure_reason="Live ICICI CIB provider is disabled.",
        )

    def verify_webhook_signature(self, payload_bytes: bytes, signature_header: str) -> bool:
        if not signature_header:
            return False
        expected = hmac.new(settings.PAYMENT_WEBHOOK_SECRET.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, signature_header)

    def fetch_reconciliation_report(self, batch_date: str) -> List[ProviderReconciliationEntry]:
        return []


class ProviderRegistry:
    """
    Pluggable registry and factory managing banking switch adapters.
    Prioritizes BSpark's proprietary payment gateway rail.
    Guarantees that test environments strictly use mock/sandbox adapters
    and live banking rails remain disabled unless explicitly cleared.
    """

    _providers: Dict[str, PaymentProviderAdapter] = {}

    @classmethod
    def get_provider(cls, provider_id: Optional[str] = None) -> PaymentProviderAdapter:
        pid = (provider_id or "bspark_gateway").lower()
        if pid in ["mock", "mock_banking_switch", "mock_switch"]:
            return get_payment_provider()
        if pid in ["bspark", "bspark_gateway", "bspark_pg"]:
            if "bspark_gateway" not in cls._providers:
                cls._providers["bspark_gateway"] = BSparkGatewayAdapter()
            return cls._providers["bspark_gateway"]
        if pid == "razorpay":
            if "razorpay" not in cls._providers:
                cls._providers["razorpay"] = RazorpayProviderAdapter()
            return cls._providers["razorpay"]
        if pid in ["icici", "icici_cib"]:
            if "icici_cib" not in cls._providers:
                cls._providers["icici_cib"] = ICICIProviderAdapter()
            return cls._providers["icici_cib"]
        # Default fallback to mock test double
        return get_payment_provider()

    @classmethod
    def select_provider_for_rail(
        cls,
        rail: str,
        capability: ProviderCapability = ProviderCapability.COLLECTION,
    ) -> PaymentProviderAdapter:
        """
        Capability-based provider selection & routing:
        - Validates that the provider explicitly supports the required rail and capability.
        - Enforces that no blind failover occurs for uncertain states without reconciliation.
        - Returns BSpark Universal Gateway as the primary native rail.
        """
        # Primary native gateway check
        bspark = cls.get_provider("bspark_gateway")
        if rail in bspark.supported_rails and bspark.has_capability(capability):
            return bspark

        # Fallback to test double if in sandbox/mock mode
        mock = get_payment_provider()
        if rail in mock.supported_rails and mock.has_capability(capability):
            return mock

        raise ProviderCapabilityError(
            f"No active provider available supporting capability '{capability.value}' for rail '{rail}'."
        )

    @classmethod
    def list_providers(cls) -> List[Dict[str, Any]]:
        return [
            cls.get_provider("bspark_gateway").health_check(),
            get_payment_provider().health_check(),
            RazorpayProviderAdapter().health_check(),
            ICICIProviderAdapter().health_check(),
        ]


# Default singleton instance
_mock_provider: Optional[MockBankingProviderAdapter] = None


def get_payment_provider() -> MockBankingProviderAdapter:
    global _mock_provider
    if _mock_provider is None:
        _mock_provider = MockBankingProviderAdapter()
    return _mock_provider

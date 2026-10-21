import re
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from sqlalchemy import desc, select
from sqlalchemy.orm import Session

from app.models.ai import (
    AiAuditRecord,
    AiChatMessageRecord,
    AiConversation,
    AiModelConfig,
    AiModelStatus,
)
from app.models.user import User, UserRole
from app.schemas.ai import (
    ActionLink,
    AiChatRequest,
    AiChatResponse,
    AiModelCreate,
    AiModelUpdate,
    AiRuntimeStatusOut,
)

# Regex Patterns for Sensitive Credential Guardrails
SECRET_PATTERNS = [
    re.compile(r"\botp\b", re.IGNORECASE),
    re.compile(r"\bone[- ]time[- ]password\b", re.IGNORECASE),
    re.compile(r"\bpin\b", re.IGNORECASE),
    re.compile(r"\bmpin\b", re.IGNORECASE),
    re.compile(r"\bpassword\b", re.IGNORECASE),
    re.compile(r"\bcvv\b", re.IGNORECASE),
    re.compile(r"\bcvc\b", re.IGNORECASE),
    re.compile(r"\bcard[- ]pin\b", re.IGNORECASE),
    re.compile(r"\batm[- ]pin\b", re.IGNORECASE),
]

FINANCIAL_EXEC_PATTERNS = [
    re.compile(r"transfer\s+(?:money|now|funds|rs|inr)", re.IGNORECASE),
    re.compile(r"execute\s+transaction", re.IGNORECASE),
    re.compile(r"send\s+payment\s+now", re.IGNORECASE),
    re.compile(r"authorize\s+payout\s+now", re.IGNORECASE),
    re.compile(r"debit\s+my\s+wallet", re.IGNORECASE),
    re.compile(r"credit\s+account\s+now", re.IGNORECASE),
]

DEFAULT_MODELS_DATA = [
    {
        "id": "qwen2.5-coder-7b",
        "name": "Qwen 2.5 Coder 7B (Core Inference)",
        "parameter_size": "7B",
        "quantization": "Q4_K_M",
        "context_window_tokens": 8192,
        "status": "ready",
        "inference_speed_tok_per_sec": 48.5,
        "family": "Qwen",
        "is_default": True,
        "temperature": 0.2,
        "top_p": 0.9,
        "runtime_type": "ollama",
        "endpoint_url": "http://localhost:11434/api/generate",
        "system_prompt": "You are the BuyMeCart IBNK Core Financial Copilot. Adhere strictly to NPCI regulations, maker-checker governance, and zero secret disclosure.",
    },
    {
        "id": "llama3.1-8b-instruct",
        "name": "Llama 3.1 8B Instruct",
        "parameter_size": "8B",
        "quantization": "Q4_K_M",
        "context_window_tokens": 8192,
        "status": "ready",
        "inference_speed_tok_per_sec": 42.0,
        "family": "Llama",
        "is_default": False,
        "temperature": 0.3,
        "top_p": 0.85,
        "runtime_type": "ollama",
        "endpoint_url": "http://localhost:11434/api/generate",
        "system_prompt": "You are an enterprise AI assistant for banking operations and dispute resolution.",
    },
    {
        "id": "mistral-7b-fintech",
        "name": "Mistral 7B Fintech Q4",
        "parameter_size": "7B",
        "quantization": "Q4_K_M",
        "context_window_tokens": 8192,
        "status": "ready",
        "inference_speed_tok_per_sec": 51.2,
        "family": "Mistral",
        "is_default": False,
        "temperature": 0.15,
        "top_p": 0.9,
        "runtime_type": "vllm",
        "endpoint_url": "http://localhost:8000/api/v1/ai/generate",
        "system_prompt": "Specialized fintech rules-engine copilot with deep knowledge of RBI circulars and double-entry accounting.",
    },
    {
        "id": "deepseek-r1-distill-8b",
        "name": "DeepSeek R1 Distill 8B (Reasoning)",
        "parameter_size": "8B",
        "quantization": "Q4_K_M",
        "context_window_tokens": 16384,
        "status": "standby",
        "inference_speed_tok_per_sec": 36.4,
        "family": "DeepSeek",
        "is_default": False,
        "temperature": 0.2,
        "top_p": 0.95,
        "runtime_type": "ollama",
        "endpoint_url": "http://localhost:11434/api/generate",
        "system_prompt": "Deep chain-of-thought reasoning engine for transaction anomaly resolution and audit trail analysis.",
    },
]


class AiService:
    @staticmethod
    def seed_default_models(db: Session) -> None:
        """Seeds the default AI model configs if table is empty."""
        existing = db.execute(select(AiModelConfig)).scalars().all()
        if not existing:
            for item in DEFAULT_MODELS_DATA:
                model = AiModelConfig(**item)
                db.add(model)
            db.commit()

    @staticmethod
    def list_models(db: Session) -> List[AiModelConfig]:
        AiService.seed_default_models(db)
        return list(db.execute(select(AiModelConfig).order_by(AiModelConfig.name)).scalars().all())

    @staticmethod
    def get_model(model_id: str, db: Session) -> Optional[AiModelConfig]:
        return db.execute(select(AiModelConfig).where(AiModelConfig.id == model_id)).scalar_one_or_none()

    @staticmethod
    def create_model(data: AiModelCreate, db: Session) -> AiModelConfig:
        if data.is_default:
            # Unset existing default
            existing_defaults = db.execute(select(AiModelConfig).where(AiModelConfig.is_default == True)).scalars().all()
            for m in existing_defaults:
                m.is_default = False

        model = AiModelConfig(
            id=data.id,
            name=data.name,
            parameter_size=data.parameter_size,
            quantization=data.quantization,
            context_window_tokens=data.context_window_tokens,
            status="ready",
            inference_speed_tok_per_sec=45.0,
            family=data.family,
            is_default=data.is_default,
            temperature=data.temperature,
            top_p=data.top_p,
            runtime_type=data.runtime_type,
            endpoint_url=data.endpoint_url,
            system_prompt=data.system_prompt,
        )
        db.add(model)
        db.commit()
        db.refresh(model)
        return model

    @staticmethod
    def update_model(model_id: str, data: AiModelUpdate, db: Session) -> Optional[AiModelConfig]:
        model = AiService.get_model(model_id, db)
        if not model:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        if update_dict.get("is_default"):
            # Unset other defaults
            existing_defaults = db.execute(
                select(AiModelConfig).where(AiModelConfig.is_default == True, AiModelConfig.id != model_id)
            ).scalars().all()
            for m in existing_defaults:
                m.is_default = False

        for key, value in update_dict.items():
            setattr(model, key, value)

        db.commit()
        db.refresh(model)
        return model

    @staticmethod
    def toggle_model_status(model_id: str, db: Session) -> Optional[AiModelConfig]:
        model = AiService.get_model(model_id, db)
        if not model:
            return None
        model.status = "standby" if model.status == "ready" else "ready"
        db.commit()
        db.refresh(model)
        return model

    @staticmethod
    def get_runtime_status(db: Session) -> AiRuntimeStatusOut:
        models = AiService.list_models(db)
        default_model = next((m for m in models if m.is_default), models[0] if models else None)
        model_id = default_model.id if default_model else "qwen2.5-coder-7b"
        endpoint = default_model.endpoint_url if default_model else "http://localhost:11434/api/generate"

        # Check connectivity
        is_live = False
        try:
            with httpx.Client(timeout=0.3) as client:
                res = client.get("http://localhost:11434/api/version")
                if res.status_code == 200:
                    is_live = True
        except Exception:
            is_live = False

        return AiRuntimeStatusOut(
            endpoint=endpoint,
            runtime_type=default_model.runtime_type if default_model else "ollama",
            status="connected" if is_live else "offline",
            version="0.5.4" if is_live else "1.0.0-embedded",
            gpu_device="NVIDIA RTX 4090 (24GB VRAM)" if is_live else "Synthetic Local Neural Unit",
            vram_used_gb=4.2 if is_live else 0.0,
            vram_total_gb=24.0,
            cpu_utilization_percent=14.5,
            ram_used_gb=8.1,
            ram_total_gb=32.0,
            active_context_tokens=1024,
            last_ping_timestamp=datetime.now(timezone.utc).isoformat(),
            active_model_id=model_id,
        )

    @staticmethod
    def process_chat(user: User, req: AiChatRequest, db: Session) -> AiChatResponse:
        start_time = time.time()
        AiService.seed_default_models(db)

        # Retrieve or create Conversation
        if req.conversation_id:
            conv = db.execute(
                select(AiConversation).where(AiConversation.id == req.conversation_id, AiConversation.user_id == user.id)
            ).scalar_one_or_none()
        else:
            conv = None

        if not conv:
            conv = AiConversation(
                user_id=user.id,
                portal=req.portal,
                title=f"Chat: {req.message[:35]}...",
            )
            db.add(conv)
            db.commit()
            db.refresh(conv)

        # 1. Secret Protection Guard
        prompt_lower = req.message.lower()
        if any(p.search(req.message) for p in SECRET_PATTERNS):
            content = (
                "⚠️ **Security Notice:** Buymecart security governance strictly prohibits entering OTPs, PINs, "
                "passwords, or CVV codes. The AI Assistant will never request, store, or accept confidential credentials. "
                "If you suspect credential exposure, contact your security officer immediately."
            )
            audit = AiAuditRecord(
                user_id=user.id,
                user_role=user.role.value,
                action_type="chat_query",
                model_id=req.model_id or "security-guard",
                prompt_summary=req.message[:100],
                response_status="BLOCKED_SECURITY",
                violations="SENSITIVE_CREDENTIAL_ATTEMPT",
            )
            db.add(audit)
            db.commit()

            return AiChatResponse(
                id=f"ai-{uuid.uuid4()}",
                conversation_id=str(conv.id),
                role="assistant",
                content=content,
                timestamp=datetime.now(timezone.utc).strftime("%H:%M"),
                action_link=None,
                is_synthetic=True,
                model_id=req.model_id or "security-guard",
                tokens_used=42,
                duration_ms=int((time.time() - start_time) * 1000),
                safety_flagged=True,
            )

        # 2. Financial Execution Guard
        if any(p.search(req.message) for p in FINANCIAL_EXEC_PATTERNS):
            portal_url = (
                "/retailer/payments"
                if req.portal == "retailer"
                else "/admin/payments?tab=authorize"
                if req.portal == "admin"
                else "/distributor/dashboard"
            )
            content = (
                "⚠️ **Transaction Governance:** The AI Assistant is an informational and diagnostic copilot. "
                "In compliance with NPCI and banking regulatory Maker-Checker policies, it cannot independently authorize "
                "or execute financial debits or transfers. Please use your authorized portal workspace to initiate payments."
            )
            audit = AiAuditRecord(
                user_id=user.id,
                user_role=user.role.value,
                action_type="chat_query",
                model_id=req.model_id or "policy-guard",
                prompt_summary=req.message[:100],
                response_status="BLOCKED_SECURITY",
                violations="UNAUTHORIZED_FINANCIAL_EXECUTION_ATTEMPT",
            )
            db.add(audit)
            db.commit()

            return AiChatResponse(
                id=f"ai-{uuid.uuid4()}",
                conversation_id=str(conv.id),
                role="assistant",
                content=content,
                timestamp=datetime.now(timezone.utc).strftime("%H:%M"),
                action_link=ActionLink(label="Open Payment Form", url=portal_url),
                is_synthetic=True,
                model_id=req.model_id or "policy-guard",
                tokens_used=56,
                duration_ms=int((time.time() - start_time) * 1000),
                safety_flagged=True,
            )

        # 3. Role Scoping Violations
        if user.role == UserRole.RETAILER and any(
            k in prompt_lower for k in ["admin key", "root key", "mcp", "sd margin", "kms vault"]
        ):
            content = (
                "🔒 **Access Restricted:** As a Retailer, you do not have authorization to view platform infrastructure "
                "keys, root credentials, or distributor margin schedules. Your permissions are scoped to retail operations, "
                "receipt generation, and transaction history."
            )
            return AiChatResponse(
                id=f"ai-{uuid.uuid4()}",
                conversation_id=str(conv.id),
                role="assistant",
                content=content,
                timestamp=datetime.now(timezone.utc).strftime("%H:%M"),
                is_synthetic=True,
                model_id="rbac-guard",
                tokens_used=48,
                duration_ms=int((time.time() - start_time) * 1000),
                safety_flagged=True,
            )

        # 4. Model Selection & Contextual Intelligence
        active_model = None
        if req.model_id:
            active_model = AiService.get_model(req.model_id, db)
        if not active_model:
            models = AiService.list_models(db)
            active_model = next((m for m in models if m.is_default), models[0] if models else None)

        model_name = active_model.name if active_model else "Qwen 2.5 Coder 7B"
        model_id = active_model.id if active_model else "qwen2.5-coder-7b"

        action_link = None
        if "balance" in prompt_lower or "float" in prompt_lower:
            if user.role in [UserRole.SUPER_DISTRIBUTOR, UserRole.ADMIN]:
                content = (
                    f"💼 **Balance Operations ({model_name}):**\n"
                    "Super Distributors can clear pending reconciliation inquiries from subordinate Area Distributors "
                    "and allocate float limits up to their authorized ceiling."
                )
                action_link = ActionLink(label="Clear Balance Queries", url="/super-distributor/dashboard")
            else:
                content = (
                    f"💰 **Wallet & Float Balance ({model_name}):**\n"
                    "Your balance reflects verified double-entry journal postings. If a recent deposit is delayed, "
                    "the switch performs 3-way reconciliation against provider callback UTRs."
                )
                action_link = ActionLink(label="View Wallet Ledger", url="/retailer/dashboard")

        elif "kyc" in prompt_lower or "onboard" in prompt_lower or "vkyc" in prompt_lower:
            content = (
                f"📋 **12-Point KYC & vKYC Protocol ({model_name}):**\n"
                "• All merchant applications require PAN, Aadhaar (masked), store geo-coordinates, and cancelled cheque.\n"
                "• A 30-second live video KYC session is captured for proof of presence.\n"
                "• Bank account validation occurs via penny-drop verification."
            )
            action_link = (
                ActionLink(label="Open Compliance Console", url="/admin/compliance")
                if user.role == UserRole.ADMIN
                else ActionLink(label="Merchant Profile", url="/retailer/profile")
            )

        elif "margin" in prompt_lower or "slab" in prompt_lower or "pricing" in prompt_lower:
            content = (
                f"⚡ **Page 3 Tempered Margin Cost Schedule ({model_name}):**\n"
                "• **Slab 1 (₹101 to ₹1,000):** Flat ₹7 platform fee\n"
                "• **Slab 2 (₹1,001 to ₹2,000):** Flat ₹9 platform fee\n"
                "• **Above ₹2,000:** Calculated transparent percentage without artificial margin caps\n"
                "• All transactions generate strictly neutral receipts without third-party bank logos (Note 1)."
            )
            action_link = ActionLink(label="View Commercials", url="/admin/modifications?tab=commercial")

        elif "receipt" in prompt_lower or "slip" in prompt_lower or "utr" in prompt_lower:
            content = (
                f"🧾 **Note 1 Neutral Receipt Guidelines ({model_name}):**\n"
                "Customer transaction receipts strictly exclude upstream banking logos (ICICI/SBI/BSpark) to preserve "
                "pure white-label integrity. Every slip includes the verified UTR, timestamp, and transaction reference."
            )
            action_link = ActionLink(label="Transaction Receipts", url="/retailer/dashboard")

        elif "report" in prompt_lower or "ledger" in prompt_lower:
            content = (
                f"📊 **Statutory Master Audit Reports ({model_name}):**\n"
                "12 statutory reports are maintained with immutable journal records:\n"
                "1. Account Ledger & 2. Wallet Ledger\n"
                "3. Transactions & 4. AEPS Master\n"
                "5. DMT PPI / Fino Rail & 6. Payment Aggregator UPI"
            )
            action_link = ActionLink(label="Open Master Reports", url="/admin/reports")

        else:
            content = (
                f"Hello {user.full_name}! I am your BuyMeCart Financial Intelligence Copilot powered by `{model_name}`.\n\n"
                "I can assist you with:\n"
                "• **Transaction Verification:** Real-time state explanations (Pending, Unknown, Settled, Reversed)\n"
                "• **Ledger & Settlement:** Inquiries regarding float balances and reconciliation\n"
                "• **KYC & Onboarding:** Step-by-step assistance through the 12-point compliance review\n"
                "• **Policy Navigation:** Direct links to authorized portal consoles and reports\n\n"
                "What would you like to check?"
            )

        duration = int((time.time() - start_time) * 1000)

        # Persist Messages in DB
        user_msg = AiChatMessageRecord(
            conversation_id=conv.id,
            user_id=user.id,
            role="user",
            content=req.message,
            model_id=model_id,
            tokens_used=len(req.message.split()) * 2,
            duration_ms=0,
            safety_flagged=False,
        )
        asst_msg = AiChatMessageRecord(
            conversation_id=conv.id,
            user_id=user.id,
            role="assistant",
            content=content,
            model_id=model_id,
            tokens_used=len(content.split()) * 2,
            duration_ms=duration,
            action_link_label=action_link.label if action_link else None,
            action_link_url=action_link.url if action_link else None,
            safety_flagged=False,
        )
        db.add(user_msg)
        db.add(asst_msg)

        # Audit Record
        audit = AiAuditRecord(
            user_id=user.id,
            user_role=user.role.value,
            action_type="chat_query",
            model_id=model_id,
            prompt_summary=req.message[:100],
            response_status="SUCCESS",
            violations=None,
        )
        db.add(audit)
        db.commit()

        return AiChatResponse(
            id=str(asst_msg.id),
            conversation_id=str(conv.id),
            role="assistant",
            content=content,
            timestamp=datetime.now(timezone.utc).strftime("%H:%M"),
            action_link=action_link,
            is_synthetic=False,
            model_id=model_id,
            tokens_used=asst_msg.tokens_used,
            duration_ms=duration,
            safety_flagged=False,
        )

    @staticmethod
    def list_audit_records(limit: int, db: Session) -> List[AiAuditRecord]:
        return list(
            db.execute(select(AiAuditRecord).order_by(desc(AiAuditRecord.created_at)).limit(limit)).scalars().all()
        )

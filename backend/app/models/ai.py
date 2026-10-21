import enum
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class AiModelStatus(str, enum.Enum):
    READY = "ready"
    LOADING = "loading"
    STANDBY = "standby"
    ERROR = "error"


class AiModelConfig(Base):
    """
    Configured AI / LLM models persisted in the platform database.
    Supports self-hosted Ollama / vLLM, custom open-weight models, and cloud runtime endpoints.
    """
    __tablename__ = "ai_model_configs"

    id: Mapped[str] = mapped_column(String(100), primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    parameter_size: Mapped[str] = mapped_column(String(50), default="8B", nullable=False)
    quantization: Mapped[str] = mapped_column(String(50), default="Q4_K_M", nullable=False)
    context_window_tokens: Mapped[int] = mapped_column(Integer, default=8192, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="ready", nullable=False)
    inference_speed_tok_per_sec: Mapped[float] = mapped_column(Float, default=45.0, nullable=False)
    family: Mapped[str] = mapped_column(String(50), default="Qwen", nullable=False)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    temperature: Mapped[float] = mapped_column(Float, default=0.2, nullable=False)
    top_p: Mapped[float] = mapped_column(Float, default=0.9, nullable=False)
    runtime_type: Mapped[str] = mapped_column(String(50), default="ollama", nullable=False)
    endpoint_url: Mapped[str] = mapped_column(String(500), default="http://localhost:11434/api/generate", nullable=False)
    api_key_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    system_prompt: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)


class AiConversation(Base):
    """
    User chat threads with the AI Copilot.
    """
    __tablename__ = "ai_conversations"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    portal: Mapped[str] = mapped_column(String(50), default="retailer", nullable=False)
    title: Mapped[str] = mapped_column(String(255), default="Fintech Support Session", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    messages: Mapped[List["AiChatMessageRecord"]] = relationship("AiChatMessageRecord", back_populates="conversation", cascade="all, delete-orphan")


class AiChatMessageRecord(Base):
    """
    Individual chat messages in an AI conversation, with token usage and audit trail.
    """
    __tablename__ = "ai_chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("ai_conversations.id", ondelete="CASCADE"), index=True, nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # user, assistant, system
    content: Mapped[str] = mapped_column(Text, nullable=False)
    model_id: Mapped[Optional[str]] = mapped_column(String(100), ForeignKey("ai_model_configs.id", ondelete="SET NULL"), nullable=True)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    action_link_label: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    action_link_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    safety_flagged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    conversation: Mapped["AiConversation"] = relationship("AiConversation", back_populates="messages")


class AiAuditRecord(Base):
    """
    Security and compliance audit records for AI model prompts, risk scans, and configuration changes.
    """
    __tablename__ = "ai_audit_records"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(Uuid, ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False)
    user_role: Mapped[str] = mapped_column(String(50), nullable=False)
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)  # chat_query, model_update, toggle_model, risk_scan
    model_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    prompt_summary: Mapped[str] = mapped_column(String(500), nullable=False)
    response_status: Mapped[str] = mapped_column(String(50), nullable=False)  # SUCCESS, BLOCKED_SECURITY, ERROR
    violations: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

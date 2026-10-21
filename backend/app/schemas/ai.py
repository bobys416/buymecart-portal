import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AiModelCreate(BaseModel):
    id: str = Field(..., min_length=2, max_length=100)
    name: str = Field(..., min_length=2, max_length=255)
    parameter_size: str = Field(default="8B")
    quantization: str = Field(default="Q4_K_M")
    context_window_tokens: int = Field(default=8192)
    family: str = Field(default="Qwen")
    temperature: float = Field(default=0.2, ge=0.0, le=2.0)
    top_p: float = Field(default=0.9, ge=0.0, le=1.0)
    runtime_type: str = Field(default="ollama")
    endpoint_url: str = Field(default="http://localhost:11434/api/generate")
    is_default: bool = Field(default=False)
    system_prompt: Optional[str] = None


class AiModelUpdate(BaseModel):
    name: Optional[str] = None
    parameter_size: Optional[str] = None
    quantization: Optional[str] = None
    context_window_tokens: Optional[int] = None
    status: Optional[str] = None
    temperature: Optional[float] = None
    top_p: Optional[float] = None
    runtime_type: Optional[str] = None
    endpoint_url: Optional[str] = None
    is_default: Optional[bool] = None
    system_prompt: Optional[str] = None


class AiModelOut(BaseModel):
    id: str
    name: str
    parameter_size: str
    quantization: str
    context_window_tokens: int
    status: str
    inference_speed_tok_per_sec: float
    family: str
    is_default: bool
    temperature: float
    top_p: float
    runtime_type: str
    endpoint_url: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ActionLink(BaseModel):
    label: str
    url: str


class AiChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    portal: str = Field(default="retailer")
    conversation_id: Optional[uuid.UUID] = None
    model_id: Optional[str] = None


class AiChatResponse(BaseModel):
    id: str
    conversation_id: str
    role: str
    content: str
    timestamp: str
    action_link: Optional[ActionLink] = None
    is_synthetic: bool
    model_id: str
    tokens_used: int
    duration_ms: int
    safety_flagged: bool


class AiRuntimeStatusOut(BaseModel):
    endpoint: str
    runtime_type: str
    status: str  # connected, degraded, offline
    version: str
    gpu_device: str
    vram_used_gb: float
    vram_total_gb: float
    cpu_utilization_percent: float
    ram_used_gb: float
    ram_total_gb: float
    active_context_tokens: int
    last_ping_timestamp: str
    active_model_id: str


class AiAuditRecordOut(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    user_role: str
    action_type: str
    model_id: Optional[str]
    prompt_summary: str
    response_status: str
    violations: Optional[str]
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

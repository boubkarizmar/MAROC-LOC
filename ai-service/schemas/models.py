from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Dict, Any


class ChatRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    message: str = Field(..., min_length=1, description="User message in any supported language")
    sessionId: Optional[str] = Field(None, description="Optional session identifier")
    language: Optional[str] = Field("auto", description="auto | darija | arabic | french | english")


class ChatResponse(BaseModel):
    response: str
    sources: List[Dict[str, Any]] = []
    property_ids: List[str] = []
    confidence: float = 0.0
    sessionId: Optional[str] = None
    session_id: Optional[str] = None
    language: Optional[str] = None
    filters: Dict[str, Any] = {}


class SearchRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    query: str = Field(..., min_length=1, description="Property search query")
    top_k: Optional[int] = Field(5, ge=1, le=20, alias="topK")
    filters: Optional[Dict[str, Any]] = Field(None, description="Optional metadata filters")


class SearchResponse(BaseModel):
    results: List[Dict[str, Any]]
    total: int


class VoiceTranscribeRequest(BaseModel):
    language: Optional[str] = Field(None, description="auto if not specified")


class VoiceTranscribeResponse(BaseModel):
    text: str
    language_detected: Optional[str] = None
    confidence: float = 0.0


class VoiceChatResponse(ChatResponse):
    transcript: str

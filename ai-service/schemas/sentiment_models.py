"""
Pydantic models for sentiment analysis API.
"""

from pydantic import BaseModel, Field
from typing import Optional


class SentimentRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to analyze")
    language: Optional[str] = Field(default="auto", description="auto | french | arabic | english | darija")


class SentimentResponse(BaseModel):
    label: str = Field(..., description="POSITIVE | NEGATIVE | NEUTRAL")
    score: float = Field(..., ge=-1.0, le=1.0, description="Sentiment score from -1.0 (very negative) to 1.0 (very positive)")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence level of the prediction")
    language_detected: Optional[str] = Field(default=None, description="Detected language")
    positive_words: list = Field(default_factory=list, description="List of positive words found")
    negative_words: list = Field(default_factory=list, description="List of negative words found")

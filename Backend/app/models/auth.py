from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class Token(BaseModel):
    """JWT Token response model"""
    access_token: str
    token_type: str = "bearer"
    expires_at: datetime


class TokenData(BaseModel):
    """Token data model for JWT payload"""
    user_id: str
    username: str
    user_type: str
    exp: Optional[datetime] = None


class AuthResponse(BaseModel):
    """Authentication response model"""
    user: dict
    token: Token
    message: str = "Login successful"
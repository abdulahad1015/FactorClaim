from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from .item import PyObjectId


class Rep(BaseModel):
    """Representative model"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str = Field(..., min_length=1, max_length=100)
    contact: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = Field(None, max_length=100)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
        schema_extra = {
            "example": {
                "name": "Jane Smith",
                "contact": "9876543210",
                "email": "jane.smith@factorclaim.com",
                "is_active": True
            }
        }


class RepCreate(BaseModel):
    """Representative creation model"""
    name: str = Field(..., min_length=1, max_length=100)
    contact: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = Field(None, max_length=100)


class RepUpdate(BaseModel):
    """Representative update model"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    contact: Optional[str] = Field(None, min_length=10, max_length=15)
    email: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
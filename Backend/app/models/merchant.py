from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from .item import PyObjectId


class Merchant(BaseModel):
    """Merchant model"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str = Field(..., min_length=1, max_length=100)
    address: str = Field(..., min_length=1, max_length=200)
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
                "name": "ABC Electronics Store",
                "address": "123 Main Street, City, State 12345",
                "contact": "5551234567",
                "email": "contact@abcelectronics.com",
                "is_active": True
            }
        }


class MerchantCreate(BaseModel):
    """Merchant creation model"""
    name: str = Field(..., min_length=1, max_length=100)
    address: str = Field(..., min_length=1, max_length=200)
    contact: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = Field(None, max_length=100)


class MerchantUpdate(BaseModel):
    """Merchant update model"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    address: Optional[str] = Field(None, min_length=1, max_length=200)
    contact: Optional[str] = Field(None, min_length=10, max_length=15)
    email: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)
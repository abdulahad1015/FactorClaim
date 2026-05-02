from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from .batch import PyObjectId


class Supplier(BaseModel):
    """Supplier model"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str = Field(..., min_length=1, max_length=100)
    contact: Optional[str] = Field(default="", max_length=15)
    email: Optional[str] = Field(default="", max_length=100)
    address: Optional[str] = Field(default="", max_length=200)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "name": "LightTech Corp",
                "contact": "0301234567",
                "email": "info@lighttech.com",
                "address": "123 Industrial Zone",
                "is_active": True
            }
        }


class SupplierCreate(BaseModel):
    """Supplier creation model"""
    name: str = Field(..., min_length=1, max_length=100)
    contact: Optional[str] = Field(default="", max_length=15)
    email: Optional[str] = Field(default="", max_length=100)
    address: Optional[str] = Field(default="", max_length=200)


class SupplierUpdate(BaseModel):
    """Supplier update model"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    contact: Optional[str] = Field(None, max_length=15)
    email: Optional[str] = Field(None, max_length=100)
    address: Optional[str] = Field(None, max_length=200)
    is_active: Optional[bool] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from bson import ObjectId
from .item import PyObjectId


class ClaimItem(BaseModel):
    """Item within a claim"""
    item_id: PyObjectId
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = Field(default="", max_length=200)
    force_add: bool = Field(default=False)  # Allow forcing items older than 15 months


class Claim(BaseModel):
    """Claim model"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    claim_id: Optional[str] = Field(default=None)  # Unique claim identifier (e.g., CLM-20241210-0001)
    rep_id: PyObjectId
    merchant_id: PyObjectId
    date: datetime = Field(default_factory=datetime.utcnow)
    items: List[ClaimItem] = Field(..., min_items=1)
    verified: bool = Field(default=False)
    verified_by: Optional[PyObjectId] = None
    verified_at: Optional[datetime] = None
    notes: Optional[str] = Field(default="", max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        populate_by_name = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "claim_id": "CLM-20241210-0001",
                "rep_id": "507f1f77bcf86cd799439011",
                "merchant_id": "507f1f77bcf86cd799439012",
                "items": [
                    {
                        "item_id": "507f1f77bcf86cd799439013",
                        "quantity": 10,
                        "notes": "Standard claim",
                        "force_add": False
                    }
                ],
                "verified": False,
                "notes": "Initial claim order"
            }
        }


class ClaimCreate(BaseModel):
    """Claim creation model"""
    rep_id: PyObjectId
    merchant_id: PyObjectId
    items: List[ClaimItem] = Field(..., min_items=1)
    notes: Optional[str] = Field(default="", max_length=500)


class ClaimUpdate(BaseModel):
    """Claim update model"""
    items: Optional[List[ClaimItem]] = Field(None, min_items=1)
    verified: Optional[bool] = None
    verified_by: Optional[PyObjectId] = None
    verified_at: Optional[datetime] = None
    notes: Optional[str] = Field(None, max_length=500)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class ClaimVerify(BaseModel):
    """Claim verification model"""
    verified_by: PyObjectId
    notes: Optional[str] = Field(default="", max_length=500)
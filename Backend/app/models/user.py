from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from bson import ObjectId
from enum import Enum
from .item import PyObjectId


class UserType(str, Enum):
    """User types enumeration"""
    ADMIN = "Admin"
    REP = "Rep"
    FACTORY = "Factory"


class User(BaseModel):
    """User model for system users"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str = Field(..., min_length=1, max_length=100)
    type: UserType
    contact_no: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = Field(None, max_length=100)
    password_hash: str = Field(..., min_length=1)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "type": "Admin",
                "contact_no": "1234567890",
                "email": "john.doe@factorclaim.com",
                "is_active": True
            }
        }


class UserCreate(BaseModel):
    """User creation model"""
    name: str = Field(..., min_length=1, max_length=100)
    type: UserType
    contact_no: str = Field(..., min_length=10, max_length=15)
    email: Optional[str] = Field(None, max_length=100)
    password: str = Field(..., min_length=6, max_length=100)


class UserUpdate(BaseModel):
    """User update model"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    type: Optional[UserType] = None
    contact_no: Optional[str] = Field(None, min_length=10, max_length=15)
    email: Optional[str] = Field(None, max_length=100)
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=6, max_length=100)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class UserLogin(BaseModel):
    """User login model"""
    email: str = Field(..., max_length=100)
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    """User response model (without password)"""
    id: Optional[str] = Field(alias="_id", default=None)
    name: str
    type: UserType
    contact_no: str
    email: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True
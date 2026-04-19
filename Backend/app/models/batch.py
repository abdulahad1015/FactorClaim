from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field
from pydantic_core import core_schema
from bson import ObjectId


class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler
    ) -> core_schema.CoreSchema:
        return core_schema.union_schema([
            core_schema.is_instance_schema(ObjectId),
            core_schema.chain_schema([
                core_schema.str_schema(),
                core_schema.no_info_plain_validator_function(cls.validate_object_id),
            ])
        ])

    @classmethod
    def validate_object_id(cls, v):
        if isinstance(v, ObjectId):
            return v
        if isinstance(v, str):
            return ObjectId(v)
        raise ValueError('Invalid ObjectId')

    @classmethod
    def __get_pydantic_json_schema__(cls, schema, model_type):
        schema.update(type='string', format='objectid')
        return schema


class Batch(BaseModel):
    """Batch model - a production run of a specific product model"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    batch_code: str = Field(..., min_length=1, max_length=50)
    model_id: PyObjectId = Field(...)
    colour: Optional[str] = Field(default="", max_length=50)
    quantity: int = Field(..., gt=0)
    production_date: datetime
    warranty_period: int = Field(..., gt=0, description="Warranty period in months")
    supplier: Optional[str] = Field(default="", max_length=100)
    contractor: Optional[str] = Field(default="", max_length=100)
    supervisor_id: Optional[PyObjectId] = Field(default=None)
    notes: Optional[str] = Field(default="", max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "batch_code": "B2024001",
                "model_id": "507f1f77bcf86cd799439011",
                "colour": "Warm White",
                "quantity": 1000,
                "production_date": "2024-01-15T00:00:00Z",
                "warranty_period": 12,
                "supplier": "LightTech Corp",
                "contractor": "ElectroSupply Ltd",
                "notes": "First production batch"
            }
        }


class BatchCreate(BaseModel):
    """Batch creation model"""
    batch_code: str = Field(..., min_length=1, max_length=50)
    model_id: PyObjectId = Field(...)
    colour: Optional[str] = Field(default="", max_length=50)
    quantity: int = Field(..., gt=0)
    production_date: datetime
    warranty_period: int = Field(..., gt=0, description="Warranty period in months")
    supplier: Optional[str] = Field(default="", max_length=100)
    contractor: Optional[str] = Field(default="", max_length=100)
    supervisor_id: Optional[PyObjectId] = Field(default=None)
    notes: Optional[str] = Field(default="", max_length=500)

    class Config:
        arbitrary_types_allowed = True


class BatchUpdate(BaseModel):
    """Batch update model"""
    batch_code: Optional[str] = Field(None, min_length=1, max_length=50)
    model_id: Optional[PyObjectId] = None
    colour: Optional[str] = Field(None, max_length=50)
    quantity: Optional[int] = Field(None, gt=0)
    production_date: Optional[datetime] = None
    warranty_period: Optional[int] = Field(None, gt=0)
    supplier: Optional[str] = Field(None, max_length=100)
    contractor: Optional[str] = Field(None, max_length=100)
    supervisor_id: Optional[PyObjectId] = Field(default=None)
    notes: Optional[str] = Field(None, max_length=500)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True

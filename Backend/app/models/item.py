from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, field_validator
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


class Item(BaseModel):
    """Item model for inventory management"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    model_name: str = Field(..., min_length=1, max_length=100)
    item_type: str = Field(..., min_length=1, max_length=50)
    batch: str = Field(..., min_length=1, max_length=50)
    production_date: datetime
    wattage: float = Field(..., gt=0)
    supplier: str = Field(..., min_length=1, max_length=100)
    contractor: Optional[str] = Field(default="", min_length=1, max_length=100)
    notes: Optional[str] = Field(default="", max_length=500)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "model_name": "LED-100W-2024",
                "item_type": "LED Bulb",
                "batch": "B2024001",
                "production_date": "2024-01-15T00:00:00Z",
                "wattage": 100.0,
                "supplier": "LightTech Corp",
                "contractor": "ElectroSupply Ltd",
                "notes": "Energy efficient LED bulb"
            }
        }


class ItemCreate(BaseModel):
    """Item creation model"""
    model_name: str = Field(..., min_length=1, max_length=100)
    item_type: str = Field(..., min_length=1, max_length=50)
    batch: str = Field(..., min_length=1, max_length=50)
    production_date: datetime
    wattage: float = Field(..., gt=0)
    supplier: str = Field(..., min_length=1, max_length=100)
    contractor: Optional[str] = Field(default="", min_length=1, max_length=100)
    notes: Optional[str] = Field(default="", max_length=500)


class ItemUpdate(BaseModel):
    """Item update model"""
    model_name: Optional[str] = Field(None, min_length=1, max_length=100)
    item_type: Optional[str] = Field(None, min_length=1, max_length=50)
    batch: Optional[str] = Field(None, min_length=1, max_length=50)
    production_date: Optional[datetime] = None
    wattage: Optional[float] = Field(None, gt=0)
    supplier: Optional[str] = Field(None, min_length=1, max_length=100)
    contractor: Optional[str] = Field(None, min_length=1, max_length=100)
    notes: Optional[str] = Field(None, max_length=500)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
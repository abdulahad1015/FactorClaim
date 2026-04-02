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


class ProductType(BaseModel):
    """Product Type model (e.g., LED Bulb, Floodlight, Panel Light)"""
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str = Field(..., min_length=1, max_length=100)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
        populate_by_name = True
        json_encoders = {ObjectId: str}
        json_schema_extra = {
            "example": {
                "name": "LED Bulb",
                "is_active": True
            }
        }


class ProductTypeCreate(BaseModel):
    """Product Type creation model"""
    name: str = Field(..., min_length=1, max_length=100)


class ProductTypeUpdate(BaseModel):
    """Product Type update model"""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    is_active: Optional[bool] = None
    updated_at: datetime = Field(default_factory=datetime.utcnow)

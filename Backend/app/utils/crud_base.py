from typing import Any, Dict, List, Optional, Union
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorCollection
from ..core.database import get_database


class CRUDBase:
    """Base CRUD operations"""
    
    def __init__(self, collection_name: str):
        self.collection_name = collection_name
    
    @property
    def collection(self) -> AsyncIOMotorCollection:
        """Get collection instance"""
        db = get_database()
        return db[self.collection_name]
    
    @staticmethod
    def serialize_doc(doc: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """Recursively convert bson.ObjectId instances to strings in a document.

        This handles nested dicts and lists so documents like claims (which contain
        ObjectId fields such as rep_id, merchant_id, items[*].item_id, verified_by)
        are converted to JSON-serializable structures.
        """
        if doc is None:
            return None

        def _convert(value: Any) -> Any:
            # Import here to avoid top-level dependency issues
            from bson import ObjectId as _ObjectId
            from datetime import datetime as _datetime

            if isinstance(value, _ObjectId):
                return str(value)
            if isinstance(value, _datetime):
                return value.isoformat()
            if isinstance(value, dict):
                return {k: _convert(v) for k, v in value.items()}
            if isinstance(value, list):
                return [_convert(v) for v in value]
            return value

        # Make sure we don't modify the original doc in-place
        return _convert(doc)
    
    @staticmethod
    def serialize_docs(docs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert ObjectId to string in list of documents"""
        return [CRUDBase.serialize_doc(doc) for doc in docs]
    
    async def create(self, obj_in: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new document"""
        result = await self.collection.insert_one(obj_in)
        obj_in["_id"] = result.inserted_id
        return self.serialize_doc(obj_in)
    
    async def get(self, id: Union[str, ObjectId]) -> Optional[Dict[str, Any]]:
        """Get document by ID"""
        if isinstance(id, str):
            id = ObjectId(id)
        doc = await self.collection.find_one({"_id": id})
        return self.serialize_doc(doc)
    
    async def get_multi(
        self, 
        skip: int = 0, 
        limit: int = 100,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Get multiple documents"""
        filter_dict = filter_dict or {}
        cursor = self.collection.find(filter_dict).skip(skip).limit(limit)
        docs = await cursor.to_list(length=limit)
        return self.serialize_docs(docs)
    
    async def update(
        self, 
        id: Union[str, ObjectId], 
        obj_in: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """Update document by ID"""
        if isinstance(id, str):
            id = ObjectId(id)
        
        # Remove None values
        update_data = {k: v for k, v in obj_in.items() if v is not None}
        
        if not update_data:
            updated_doc = await self.get(id)
            return updated_doc
        
        result = await self.collection.update_one(
            {"_id": id}, 
            {"$set": update_data}
        )
        
        if result.modified_count:
            updated_doc = await self.collection.find_one({"_id": id})
            return self.serialize_doc(updated_doc)
        return None
    
    async def delete(self, id: Union[str, ObjectId]) -> bool:
        """Delete document by ID"""
        if isinstance(id, str):
            id = ObjectId(id)
        
        result = await self.collection.delete_one({"_id": id})
        return result.deleted_count > 0
    
    async def count(self, filter_dict: Optional[Dict[str, Any]] = None) -> int:
        """Count documents"""
        filter_dict = filter_dict or {}
        return await self.collection.count_documents(filter_dict)
    
    async def exists(self, id: Union[str, ObjectId]) -> bool:
        """Check if document exists"""
        if isinstance(id, str):
            id = ObjectId(id)
        
        count = await self.collection.count_documents({"_id": id})
        return count > 0
from typing import Any, Dict, List, Optional
from bson import ObjectId
from ..utils.crud_base import CRUDBase
from ..models.batch import BatchCreate, BatchUpdate


class CRUDBatch(CRUDBase):
    """CRUD operations for Batch"""
    
    def __init__(self):
        super().__init__("batches")
    
    async def create_batch(self, batch_in: BatchCreate) -> Dict[str, Any]:
        """Create a new batch"""
        batch_data = batch_in.dict()
        if "model_id" in batch_data:
            batch_data["model_id"] = ObjectId(batch_data["model_id"])
        if "supervisor_id" in batch_data and batch_data["supervisor_id"]:
            batch_data["supervisor_id"] = ObjectId(batch_data["supervisor_id"])
        return await self.create(batch_data)
    
    async def get_batch(self, batch_id: str) -> Optional[Dict[str, Any]]:
        """Get batch by ID"""
        return await self.get(batch_id)
    
    async def get_batch_by_code(self, batch_code: str) -> Optional[Dict[str, Any]]:
        """Get batch by batch code (for barcode scanning)"""
        return await self.collection.find_one({"batch_code": batch_code})
    
    async def search_by_barcode(self, barcode: str) -> Optional[Dict[str, Any]]:
        """Search batch by barcode - batch code search with exact and case-insensitive matching"""
        barcode = barcode.strip()
        
        # Try exact batch_code match first
        batch = await self.collection.find_one({"batch_code": barcode})
        if batch:
            return self.serialize_doc(batch)
        
        # Try case-insensitive match
        batch = await self.collection.find_one({
            "batch_code": {"$regex": f"^{barcode}$", "$options": "i"}
        })
        return self.serialize_doc(batch) if batch else None
    
    async def get_batches(
        self,
        skip: int = 0,
        limit: int = 100,
        model_id: Optional[str] = None,
        batch_code: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get batches with optional filters"""
        filter_dict = {}
        if model_id:
            filter_dict["model_id"] = ObjectId(model_id)
        if batch_code:
            filter_dict["batch_code"] = batch_code
        return await self.get_multi(skip=skip, limit=limit, filter_dict=filter_dict)
    
    async def update_batch(
        self, 
        batch_id: str, 
        batch_in: BatchUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update batch"""
        batch_data = batch_in.dict(exclude_unset=True)
        if "model_id" in batch_data and batch_data["model_id"]:
            batch_data["model_id"] = ObjectId(batch_data["model_id"])
        if "supervisor_id" in batch_data and batch_data["supervisor_id"]:
            batch_data["supervisor_id"] = ObjectId(batch_data["supervisor_id"])
        return await self.update(batch_id, batch_data)
    
    async def delete_batch(self, batch_id: str) -> bool:
        """Delete batch"""
        return await self.delete(batch_id)
    
    async def search_batches(self, search_term: str) -> List[Dict[str, Any]]:
        """Search batches by batch_code, colour, supplier, or contractor"""
        filter_dict = {
            "$or": [
                {"batch_code": {"$regex": search_term, "$options": "i"}},
                {"colour": {"$regex": search_term, "$options": "i"}},
                {"supplier": {"$regex": search_term, "$options": "i"}},
                {"contractor": {"$regex": search_term, "$options": "i"}}
            ]
        }
        return await self.get_multi(filter_dict=filter_dict)


# Create instance
batch_crud = CRUDBatch()

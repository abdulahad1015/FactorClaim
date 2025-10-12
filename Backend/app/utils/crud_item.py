from typing import Any, Dict, List, Optional
from bson import ObjectId
from ..utils.crud_base import CRUDBase
from ..models.item import Item, ItemCreate, ItemUpdate


class CRUDItem(CRUDBase):
    """CRUD operations for Item"""
    
    def __init__(self):
        super().__init__("items")
    
    async def create_item(self, item_in: ItemCreate) -> Dict[str, Any]:
        """Create a new item"""
        item_data = item_in.dict()
        return await self.create(item_data)
    
    async def get_item(self, item_id: str) -> Optional[Dict[str, Any]]:
        """Get item by ID"""
        return await self.get(item_id)
    
    async def get_items(
        self,
        skip: int = 0,
        limit: int = 100,
        name: Optional[str] = None,
        model: Optional[str] = None,
        batch: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Get items with optional filters"""
        filter_dict = {}
        
        if name:
            filter_dict["name"] = {"$regex": name, "$options": "i"}
        if model:
            filter_dict["model"] = {"$regex": model, "$options": "i"}
        if batch:
            filter_dict["batch"] = batch
        
        return await self.get_multi(skip=skip, limit=limit, filter_dict=filter_dict)
    
    async def update_item(
        self, 
        item_id: str, 
        item_in: ItemUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update item"""
        item_data = item_in.dict(exclude_unset=True)
        return await self.update(item_id, item_data)
    
    async def delete_item(self, item_id: str) -> bool:
        """Delete item"""
        return await self.delete(item_id)
    
    async def search_items(self, search_term: str) -> List[Dict[str, Any]]:
        """Search items by name, model, or batch"""
        filter_dict = {
            "$or": [
                {"name": {"$regex": search_term, "$options": "i"}},
                {"model": {"$regex": search_term, "$options": "i"}},
                {"batch": {"$regex": search_term, "$options": "i"}},
                {"supplier": {"$regex": search_term, "$options": "i"}},
                {"contractor": {"$regex": search_term, "$options": "i"}}
            ]
        }
        return await self.get_multi(filter_dict=filter_dict)


# Create instance
item_crud = CRUDItem()
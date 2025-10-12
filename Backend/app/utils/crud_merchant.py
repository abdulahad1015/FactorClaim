from typing import Any, Dict, List, Optional
from bson import ObjectId
from ..utils.crud_base import CRUDBase
from ..models.merchant import Merchant, MerchantCreate, MerchantUpdate


class CRUDMerchant(CRUDBase):
    """CRUD operations for Merchant"""
    
    def __init__(self):
        super().__init__("merchants")
    
    async def create_merchant(self, merchant_in: MerchantCreate) -> Dict[str, Any]:
        """Create a new merchant"""
        merchant_data = merchant_in.dict()
        return await self.create(merchant_data)
    
    async def get_merchant(self, merchant_id: str) -> Optional[Dict[str, Any]]:
        """Get merchant by ID"""
        return await self.get(merchant_id)
    
    async def get_merchants(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Get merchants with optional filters"""
        filter_dict = {}
        
        if is_active is not None:
            filter_dict["is_active"] = is_active
        
        return await self.get_multi(skip=skip, limit=limit, filter_dict=filter_dict)
    
    async def update_merchant(
        self, 
        merchant_id: str, 
        merchant_in: MerchantUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update merchant"""
        merchant_data = merchant_in.dict(exclude_unset=True)
        return await self.update(merchant_id, merchant_data)
    
    async def delete_merchant(self, merchant_id: str) -> bool:
        """Delete merchant"""
        return await self.delete(merchant_id)
    
    async def search_merchants(self, search_term: str) -> List[Dict[str, Any]]:
        """Search merchants by name or address"""
        filter_dict = {
            "$or": [
                {"name": {"$regex": search_term, "$options": "i"}},
                {"address": {"$regex": search_term, "$options": "i"}}
            ]
        }
        return await self.get_multi(filter_dict=filter_dict)


# Create instance
merchant_crud = CRUDMerchant()
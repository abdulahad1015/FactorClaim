from typing import Any, Dict, List, Optional
from bson import ObjectId
from ..utils.crud_base import CRUDBase
from ..models.product_model import ProductModelCreate, ProductModelUpdate


class CRUDProductModel(CRUDBase):
    """CRUD operations for Product Model"""
    
    def __init__(self):
        super().__init__("models")
    
    async def create_product_model(self, pm_in: ProductModelCreate) -> Dict[str, Any]:
        """Create a new product model"""
        pm_data = pm_in.dict()
        if "product_type_id" in pm_data:
            pm_data["product_type_id"] = ObjectId(pm_data["product_type_id"])
        return await self.create(pm_data)
    
    async def get_product_model(self, pm_id: str) -> Optional[Dict[str, Any]]:
        """Get product model by ID"""
        return await self.get(pm_id)
    
    async def get_product_models(
        self,
        skip: int = 0,
        limit: int = 100,
        product_type_id: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Get product models with optional filters"""
        filter_dict = {}
        if product_type_id:
            filter_dict["product_type_id"] = ObjectId(product_type_id)
        if is_active is not None:
            filter_dict["is_active"] = is_active
        return await self.get_multi(skip=skip, limit=limit, filter_dict=filter_dict)
    
    async def update_product_model(
        self, 
        pm_id: str, 
        pm_in: ProductModelUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update product model"""
        pm_data = pm_in.dict(exclude_unset=True)
        if "product_type_id" in pm_data and pm_data["product_type_id"]:
            pm_data["product_type_id"] = ObjectId(pm_data["product_type_id"])
        return await self.update(pm_id, pm_data)
    
    async def delete_product_model(self, pm_id: str) -> bool:
        """Delete product model"""
        return await self.delete(pm_id)
    
    async def search_product_models(self, search_term: str) -> List[Dict[str, Any]]:
        """Search product models by name, supplier, or contractor"""
        filter_dict = {
            "$or": [
                {"name": {"$regex": search_term, "$options": "i"}},
                {"supplier": {"$regex": search_term, "$options": "i"}},
                {"contractor": {"$regex": search_term, "$options": "i"}}
            ]
        }
        return await self.get_multi(filter_dict=filter_dict)


# Create instance
product_model_crud = CRUDProductModel()

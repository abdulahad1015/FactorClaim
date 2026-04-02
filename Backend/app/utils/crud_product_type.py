from typing import Any, Dict, List, Optional
from ..utils.crud_base import CRUDBase
from ..models.product_type import ProductTypeCreate, ProductTypeUpdate


class CRUDProductType(CRUDBase):
    """CRUD operations for Product Type"""
    
    def __init__(self):
        super().__init__("product_types")
    
    async def create_product_type(self, pt_in: ProductTypeCreate) -> Dict[str, Any]:
        """Create a new product type"""
        pt_data = pt_in.dict()
        return await self.create(pt_data)
    
    async def get_product_type(self, pt_id: str) -> Optional[Dict[str, Any]]:
        """Get product type by ID"""
        return await self.get(pt_id)
    
    async def get_product_types(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Get product types with optional filters"""
        filter_dict = {}
        if is_active is not None:
            filter_dict["is_active"] = is_active
        return await self.get_multi(skip=skip, limit=limit, filter_dict=filter_dict)
    
    async def update_product_type(
        self, 
        pt_id: str, 
        pt_in: ProductTypeUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update product type"""
        pt_data = pt_in.dict(exclude_unset=True)
        return await self.update(pt_id, pt_data)
    
    async def delete_product_type(self, pt_id: str) -> bool:
        """Delete product type"""
        return await self.delete(pt_id)


# Create instance
product_type_crud = CRUDProductType()

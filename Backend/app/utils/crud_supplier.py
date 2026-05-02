from typing import Any, Dict, List, Optional
from bson import ObjectId
from ..utils.crud_base import CRUDBase
from ..models.supplier import SupplierCreate, SupplierUpdate


class CRUDSupplier(CRUDBase):
    """CRUD operations for Supplier"""

    def __init__(self):
        super().__init__("suppliers")

    async def create_supplier(self, supplier_in: SupplierCreate) -> Dict[str, Any]:
        """Create a new supplier"""
        supplier_data = supplier_in.dict()
        return await self.create(supplier_data)

    async def get_supplier(self, supplier_id: str) -> Optional[Dict[str, Any]]:
        """Get supplier by ID"""
        return await self.get(supplier_id)

    async def get_suppliers(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Get suppliers with optional filters"""
        filter_dict = {}
        if is_active is not None:
            filter_dict["is_active"] = is_active
        return await self.get_multi(skip=skip, limit=limit, filter_dict=filter_dict)

    async def update_supplier(
        self,
        supplier_id: str,
        supplier_in: SupplierUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update supplier"""
        supplier_data = supplier_in.dict(exclude_unset=True)
        return await self.update(supplier_id, supplier_data)

    async def delete_supplier(self, supplier_id: str) -> bool:
        """Delete supplier"""
        return await self.delete(supplier_id)

    async def search_suppliers(self, search_term: str) -> List[Dict[str, Any]]:
        """Search suppliers by name"""
        filter_dict = {
            "name": {"$regex": search_term, "$options": "i"}
        }
        return await self.get_multi(filter_dict=filter_dict)


# Create instance
supplier_crud = CRUDSupplier()

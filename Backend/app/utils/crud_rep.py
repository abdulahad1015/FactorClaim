from typing import Any, Dict, List, Optional
from bson import ObjectId
from ..utils.crud_base import CRUDBase
from ..models.rep import Rep, RepCreate, RepUpdate


class CRUDRep(CRUDBase):
    """CRUD operations for Rep"""
    
    def __init__(self):
        super().__init__("reps")
    
    async def create_rep(self, rep_in: RepCreate) -> Dict[str, Any]:
        """Create a new rep"""
        rep_data = rep_in.dict()
        return await self.create(rep_data)
    
    async def get_rep(self, rep_id: str) -> Optional[Dict[str, Any]]:
        """Get rep by ID"""
        return await self.get(rep_id)
    
    async def get_reps(
        self,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Get reps with optional filters"""
        filter_dict = {}
        
        if is_active is not None:
            filter_dict["is_active"] = is_active
        
        return await self.get_multi(skip=skip, limit=limit, filter_dict=filter_dict)
    
    async def update_rep(
        self, 
        rep_id: str, 
        rep_in: RepUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update rep"""
        rep_data = rep_in.dict(exclude_unset=True)
        return await self.update(rep_id, rep_data)
    
    async def delete_rep(self, rep_id: str) -> bool:
        """Delete rep"""
        return await self.delete(rep_id)


# Create instance
rep_crud = CRUDRep()
from typing import Any, Dict, List, Optional
from ..utils.crud_base import CRUDBase
from ..models.location import LocationCreate, LocationUpdate


class CRUDLocation(CRUDBase):
    """CRUD operations for Location"""
    
    def __init__(self):
        super().__init__("locations")
    
    async def create_location(self, loc_in: LocationCreate) -> Dict[str, Any]:
        """Create a new location"""
        loc_data = loc_in.dict()
        return await self.create(loc_data)
    
    async def get_location(self, loc_id: str) -> Optional[Dict[str, Any]]:
        """Get location by ID"""
        return await self.get(loc_id)
    
    async def get_locations(
        self,
        skip: int = 0,
        limit: int = 1000,
        province: Optional[str] = None,
        is_active: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Get locations with optional filters"""
        filter_dict = {}
        if province:
            filter_dict["province"] = province
        if is_active is not None:
            filter_dict["is_active"] = is_active
        return await self.get_multi(skip=skip, limit=limit, filter_dict=filter_dict)
    
    async def search_locations(self, search_term: str) -> List[Dict[str, Any]]:
        """Search locations by name (type-ahead)"""
        filter_dict = {
            "is_active": True,
            "name": {"$regex": search_term, "$options": "i"}
        }
        return await self.get_multi(filter_dict=filter_dict, limit=20)
    
    async def update_location(
        self, 
        loc_id: str, 
        loc_in: LocationUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update location"""
        loc_data = loc_in.dict(exclude_unset=True)
        return await self.update(loc_id, loc_data)
    
    async def delete_location(self, loc_id: str) -> bool:
        """Delete location"""
        return await self.delete(loc_id)


# Create instance
location_crud = CRUDLocation()

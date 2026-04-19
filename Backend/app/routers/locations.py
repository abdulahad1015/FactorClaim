from fastapi import APIRouter, HTTPException, status, Depends
from typing import Optional
from ..models.location import LocationCreate, LocationUpdate
from ..utils.crud_location import location_crud
from ..utils.dependencies import get_current_user, require_admin, require_admin_or_rep

router = APIRouter()


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_location(
    location: LocationCreate,
    current_user=Depends(get_current_user)
):
    """Create a new location (Admin or Sales Manager or Rep)"""
    return await location_crud.create_location(location)


@router.get("/")
async def get_locations(
    skip: int = 0,
    limit: int = 1000,
    province: Optional[str] = None,
    current_user=Depends(get_current_user)
):
    """Get all locations"""
    return await location_crud.get_locations(skip=skip, limit=limit, province=province, is_active=True)


@router.get("/search/{search_term}")
async def search_locations(
    search_term: str,
    current_user=Depends(get_current_user)
):
    """Search locations by name (type-ahead)"""
    return await location_crud.search_locations(search_term)


@router.get("/{location_id}")
async def get_location(
    location_id: str,
    current_user=Depends(get_current_user)
):
    """Get location by ID"""
    location = await location_crud.get_location(location_id)
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location


@router.put("/{location_id}")
async def update_location(
    location_id: str,
    location: LocationUpdate,
    current_user=Depends(require_admin)
):
    """Update location (Admin only)"""
    updated = await location_crud.update_location(location_id, location)
    if not updated:
        raise HTTPException(status_code=404, detail="Location not found")
    return updated


@router.delete("/{location_id}")
async def delete_location(
    location_id: str,
    current_user=Depends(require_admin)
):
    """Delete location (Admin only)"""
    deleted = await location_crud.delete_location(location_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"message": "Location deleted successfully"}

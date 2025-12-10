from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from ..models.item import Item, ItemCreate, ItemUpdate
from ..utils.crud_item import item_crud
from ..utils.dependencies import require_admin, require_admin_or_rep, get_current_active_user


router = APIRouter()


@router.post("/", response_model=dict, dependencies=[Depends(require_admin)])
async def create_item(item: ItemCreate):
    """Create a new item (Admin only)"""
    return await item_crud.create_item(item)


@router.get("/", response_model=List[dict])
async def read_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    model_name: Optional[str] = Query(None),
    item_type: Optional[str] = Query(None),
    batch: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Get items with optional filters"""
    return await item_crud.get_items(
        skip=skip, 
        limit=limit, 
        model_name=model_name, 
        item_type=item_type, 
        batch=batch
    )


@router.get("/batch/{batch_code:path}", response_model=dict)
async def read_item_by_batch(
    batch_code: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get item by batch code (for barcode scanning) - supports flexible matching"""
    print(f"[DEBUG] Searching for batch code: '{batch_code}' (length: {len(batch_code)})")
    item = await item_crud.search_by_barcode(batch_code)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Item with barcode '{batch_code}' not found. Please verify the item exists in inventory."
        )
    print(f"[DEBUG] Found item: {item.get('model_name')} - Batch: {item.get('batch')}")
    return item


@router.get("/{item_id}", response_model=dict)
async def read_item(
    item_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get item by ID"""
    item = await item_crud.get_item(item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    return item


@router.put("/{item_id}", response_model=dict, dependencies=[Depends(require_admin)])
async def update_item(item_id: str, item: ItemUpdate):
    """Update item (Admin only)"""
    updated_item = await item_crud.update_item(item_id, item)
    if updated_item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    return updated_item


@router.delete("/{item_id}", dependencies=[Depends(require_admin)])
async def delete_item(item_id: str):
    """Delete item (Admin only)"""
    deleted = await item_crud.delete_item(item_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    return {"message": "Item deleted successfully"}


@router.get("/search/{search_term}", response_model=List[dict])
async def search_items(
    search_term: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Search items by model_name, item_type, batch, supplier, or contractor"""
    return await item_crud.search_items(search_term)


class ProductionDateCheckResponse(BaseModel):
    """Response model for production date check"""
    item_id: str
    model_name: str
    batch: str
    production_date: str
    age_months: int
    is_old: bool
    requires_confirmation: bool
    message: str


@router.get("/{item_id}/check-age", response_model=ProductionDateCheckResponse)
async def check_item_production_date(
    item_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """
    Check if item production date is older than 15 months.
    Returns warning if item requires confirmation before adding to claim.
    """
    item = await item_crud.get_item(item_id)
    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )
    
    production_date = item.get("production_date")
    if not production_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item has no production date"
        )
    
    # Calculate age in months
    age_days = (datetime.utcnow() - production_date).days
    age_months = int(age_days / 30)
    
    # Check if older than 15 months
    fifteen_months_ago = datetime.utcnow() - timedelta(days=15*30)
    is_old = production_date < fifteen_months_ago
    
    message = "Item is within acceptable age range"
    if is_old:
        message = f"⚠️ WARNING: This item is {age_months} months old (older than 15 months). Please confirm before adding to claim."
    
    return ProductionDateCheckResponse(
        item_id=str(item.get("_id")),
        model_name=item.get("model_name"),
        batch=item.get("batch"),
        production_date=production_date.isoformat(),
        age_months=age_months,
        is_old=is_old,
        requires_confirmation=is_old,
        message=message
    )
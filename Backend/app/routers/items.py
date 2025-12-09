from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
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
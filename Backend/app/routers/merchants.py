from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from ..models.merchant import MerchantCreate, MerchantUpdate
from ..utils.crud_merchant import merchant_crud
from ..utils.dependencies import require_admin_or_rep, get_current_active_user


router = APIRouter()


@router.post("/", response_model=dict, dependencies=[Depends(require_admin_or_rep)])
async def create_merchant(merchant: MerchantCreate):
    """Create a new merchant (Admin or Rep)"""
    return await merchant_crud.create_merchant(merchant)


@router.get("/", response_model=List[dict])
async def read_merchants(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Get merchants with optional filters"""
    return await merchant_crud.get_merchants(
        skip=skip,
        limit=limit,
        is_active=is_active
    )


@router.get("/{merchant_id}", response_model=dict)
async def read_merchant(
    merchant_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get merchant by ID"""
    merchant = await merchant_crud.get_merchant(merchant_id)
    if merchant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchant not found"
        )
    return merchant


@router.put("/{merchant_id}", response_model=dict, dependencies=[Depends(require_admin_or_rep)])
async def update_merchant(merchant_id: str, merchant: MerchantUpdate):
    """Update merchant (Admin or Rep)"""
    updated_merchant = await merchant_crud.update_merchant(merchant_id, merchant)
    if updated_merchant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchant not found"
        )
    return updated_merchant


@router.delete("/{merchant_id}", dependencies=[Depends(require_admin_or_rep)])
async def delete_merchant(merchant_id: str):
    """Delete merchant (Admin or Rep)"""
    deleted = await merchant_crud.delete_merchant(merchant_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Merchant not found"
        )
    return {"message": "Merchant deleted successfully"}


@router.get("/search/{search_term}", response_model=List[dict])
async def search_merchants(
    search_term: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Search merchants by name or address"""
    return await merchant_crud.search_merchants(search_term)
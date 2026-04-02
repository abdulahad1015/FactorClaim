from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from ..models.product_type import ProductTypeCreate, ProductTypeUpdate
from ..utils.crud_product_type import product_type_crud
from ..utils.dependencies import require_admin, get_current_active_user


router = APIRouter()


@router.post("/", response_model=dict, dependencies=[Depends(require_admin)])
async def create_product_type(product_type: ProductTypeCreate):
    """Create a new product type (Admin only)"""
    return await product_type_crud.create_product_type(product_type)


@router.get("/", response_model=List[dict])
async def read_product_types(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Get product types with optional filters"""
    return await product_type_crud.get_product_types(
        skip=skip,
        limit=limit,
        is_active=is_active
    )


@router.get("/{product_type_id}", response_model=dict)
async def read_product_type(
    product_type_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get product type by ID"""
    pt = await product_type_crud.get_product_type(product_type_id)
    if pt is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product type not found"
        )
    return pt


@router.put("/{product_type_id}", response_model=dict, dependencies=[Depends(require_admin)])
async def update_product_type(product_type_id: str, product_type: ProductTypeUpdate):
    """Update product type (Admin only)"""
    updated = await product_type_crud.update_product_type(product_type_id, product_type)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product type not found"
        )
    return updated


@router.delete("/{product_type_id}", dependencies=[Depends(require_admin)])
async def delete_product_type(product_type_id: str):
    """Delete product type (Admin only)"""
    deleted = await product_type_crud.delete_product_type(product_type_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product type not found"
        )
    return {"message": "Product type deleted successfully"}

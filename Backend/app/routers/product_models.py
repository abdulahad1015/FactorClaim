from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from ..models.product_model import ProductModelCreate, ProductModelUpdate
from ..utils.crud_product_model import product_model_crud
from ..utils.dependencies import require_admin, get_current_active_user


router = APIRouter()


@router.post("/", response_model=dict, dependencies=[Depends(require_admin)])
async def create_product_model(product_model: ProductModelCreate):
    """Create a new product model (Admin only)"""
    return await product_model_crud.create_product_model(product_model)


@router.get("/", response_model=List[dict])
async def read_product_models(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    product_type_id: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Get product models with optional filters"""
    return await product_model_crud.get_product_models(
        skip=skip,
        limit=limit,
        product_type_id=product_type_id,
        is_active=is_active
    )


@router.get("/{model_id}", response_model=dict)
async def read_product_model(
    model_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get product model by ID"""
    pm = await product_model_crud.get_product_model(model_id)
    if pm is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product model not found"
        )
    return pm


@router.put("/{model_id}", response_model=dict, dependencies=[Depends(require_admin)])
async def update_product_model(model_id: str, product_model: ProductModelUpdate):
    """Update product model (Admin only)"""
    updated = await product_model_crud.update_product_model(model_id, product_model)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product model not found"
        )
    return updated


@router.delete("/{model_id}", dependencies=[Depends(require_admin)])
async def delete_product_model(model_id: str):
    """Delete product model (Admin only)"""
    deleted = await product_model_crud.delete_product_model(model_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product model not found"
        )
    return {"message": "Product model deleted successfully"}


@router.get("/search/{search_term}", response_model=List[dict])
async def search_product_models(
    search_term: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Search product models by name, supplier, or contractor"""
    return await product_model_crud.search_product_models(search_term)

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from ..models.supplier import SupplierCreate, SupplierUpdate
from ..utils.crud_supplier import supplier_crud
from ..utils.dependencies import require_admin, get_current_active_user
from ..core.database import get_database


router = APIRouter()


@router.post("/", response_model=dict, dependencies=[Depends(require_admin)])
async def create_supplier(supplier: SupplierCreate):
    """Create a new supplier (Admin only)"""
    return await supplier_crud.create_supplier(supplier)


@router.get("/", response_model=List[dict])
async def read_suppliers(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    is_active: Optional[bool] = Query(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Get suppliers with optional filters"""
    return await supplier_crud.get_suppliers(
        skip=skip,
        limit=limit,
        is_active=is_active
    )


@router.get("/{supplier_id}", response_model=dict)
async def read_supplier(
    supplier_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get supplier by ID"""
    supplier = await supplier_crud.get_supplier(supplier_id)
    if supplier is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    return supplier


@router.put("/{supplier_id}", response_model=dict, dependencies=[Depends(require_admin)])
async def update_supplier(supplier_id: str, supplier: SupplierUpdate):
    """Update supplier (Admin only)"""
    updated = await supplier_crud.update_supplier(supplier_id, supplier)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    return updated


@router.delete("/{supplier_id}", dependencies=[Depends(require_admin)])
async def delete_supplier(supplier_id: str):
    """Delete supplier (Admin only)"""
    db = get_database()
    batch_count = await db["batches"].count_documents({"supplier_id": ObjectId(supplier_id)})
    if batch_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete supplier: it is referenced by {batch_count} batch(es)"
        )
    deleted = await supplier_crud.delete_supplier(supplier_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Supplier not found"
        )
    return {"message": "Supplier deleted successfully"}

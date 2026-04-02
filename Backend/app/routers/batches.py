from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from ..models.batch import BatchCreate, BatchUpdate
from ..utils.crud_batch import batch_crud
from ..utils.dependencies import require_admin, get_current_active_user


router = APIRouter()


@router.post("/", response_model=dict, dependencies=[Depends(require_admin)])
async def create_batch(batch: BatchCreate):
    """Create a new batch (Admin only)"""
    return await batch_crud.create_batch(batch)


@router.get("/", response_model=List[dict])
async def read_batches(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    model_id: Optional[str] = Query(None),
    batch_code: Optional[str] = Query(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Get batches with optional filters"""
    return await batch_crud.get_batches(
        skip=skip,
        limit=limit,
        model_id=model_id,
        batch_code=batch_code
    )


@router.get("/barcode/{batch_code:path}", response_model=dict)
async def read_batch_by_barcode(
    batch_code: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get batch by batch code (for barcode scanning) - supports flexible matching"""
    batch = await batch_crud.search_by_barcode(batch_code)
    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Batch with barcode '{batch_code}' not found. Please verify the batch exists in inventory."
        )
    return batch


@router.get("/search/{search_term}", response_model=List[dict])
async def search_batches(
    search_term: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Search batches by batch_code, colour, supplier, or contractor"""
    return await batch_crud.search_batches(search_term)


@router.get("/{batch_id}", response_model=dict)
async def read_batch(
    batch_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get batch by ID"""
    batch = await batch_crud.get_batch(batch_id)
    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )
    return batch


class WarrantyCheckResponse(BaseModel):
    """Response model for warranty check"""
    batch_id: str
    batch_code: str
    production_date: str
    warranty_period: int
    age_months: int
    is_expired: bool
    requires_confirmation: bool
    message: str


@router.get("/{batch_id}/check-warranty", response_model=WarrantyCheckResponse)
async def check_batch_warranty(
    batch_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Check if batch warranty has expired based on production_date + warranty_period"""
    batch = await batch_crud.get_batch(batch_id)
    if batch is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )
    
    production_date = batch.get("production_date")
    warranty_period = batch.get("warranty_period", 12)
    
    if not production_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Batch has no production date"
        )
    
    if isinstance(production_date, str):
        try:
            production_date = datetime.fromisoformat(production_date.replace('Z', '+00:00'))
        except (ValueError, AttributeError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid production date format"
            )
    
    age_days = (datetime.utcnow() - production_date).days
    age_months = int(age_days / 30)
    is_expired = age_months > warranty_period
    
    if is_expired:
        message = f"Batch '{batch.get('batch_code')}' warranty has expired ({age_months} months old, warranty: {warranty_period} months)"
    else:
        remaining = warranty_period - age_months
        message = f"Batch '{batch.get('batch_code')}' is within warranty ({age_months} months old, {remaining} months remaining)"
    
    return WarrantyCheckResponse(
        batch_id=str(batch.get("_id")),
        batch_code=batch.get("batch_code", ""),
        production_date=production_date.isoformat() if hasattr(production_date, 'isoformat') else str(production_date),
        warranty_period=warranty_period,
        age_months=age_months,
        is_expired=is_expired,
        requires_confirmation=is_expired,
        message=message
    )


@router.put("/{batch_id}", response_model=dict, dependencies=[Depends(require_admin)])
async def update_batch(batch_id: str, batch: BatchUpdate):
    """Update batch (Admin only)"""
    updated = await batch_crud.update_batch(batch_id, batch)
    if updated is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )
    return updated


@router.delete("/{batch_id}", dependencies=[Depends(require_admin)])
async def delete_batch(batch_id: str):
    """Delete batch (Admin only)"""
    deleted = await batch_crud.delete_batch(batch_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )
    return {"message": "Batch deleted successfully"}

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from ..models.claim import ClaimCreate, ClaimUpdate, ClaimVerify, ClaimBiltyUpdate, ClaimApprove
from ..utils.crud_claim import claim_crud
from ..utils.dependencies import (
    require_admin_or_rep, 
    require_admin_or_factory, 
    get_current_active_user
)


router = APIRouter()


@router.post("/", response_model=dict, dependencies=[Depends(require_admin_or_rep)])
async def create_claim(claim: ClaimCreate):
    """Create a new claim (Admin or Rep)"""
    return await claim_crud.create_claim(claim)


@router.get("/", response_model=List[dict])
async def read_claims(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    rep_id: Optional[str] = Query(None),
    merchant_id: Optional[str] = Query(None),
    verified: Optional[bool] = Query(None),
    current_user: dict = Depends(get_current_active_user)
):
    """Get claims with optional filters"""
    return await claim_crud.get_claims(
        skip=skip,
        limit=limit,
        rep_id=rep_id,
        merchant_id=merchant_id,
        verified=verified
    )


@router.get("/unverified", response_model=List[dict], dependencies=[Depends(require_admin_or_factory)])
async def read_unverified_claims():
    """Get all unverified claims (Admin or Factory)"""
    return await claim_crud.get_unverified_claims()


@router.get("/rep/{rep_id}", response_model=List[dict])
async def read_claims_by_rep(
    rep_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get all claims for a representative"""
    return await claim_crud.get_claims_by_rep(rep_id)


@router.get("/claim-id/{claim_id}", response_model=dict)
async def read_claim_by_claim_id(
    claim_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get claim by unique claim_id (e.g., CLM-20241210-0001)"""
    claim = await claim_crud.get_claim_by_claim_id(claim_id)
    if claim is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Claim with claim_id '{claim_id}' not found"
        )
    return claim


@router.get("/{claim_id}", response_model=dict)
async def read_claim(
    claim_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get claim by ID"""
    claim = await claim_crud.get_claim(claim_id)
    if claim is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    return claim


@router.put("/{claim_id}", response_model=dict, dependencies=[Depends(require_admin_or_rep)])
async def update_claim(claim_id: str, claim: ClaimUpdate):
    """Update claim (Admin or Rep)"""
    updated_claim = await claim_crud.update_claim(claim_id, claim)
    if updated_claim is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    return updated_claim


@router.put("/{claim_id}/verify", response_model=dict, dependencies=[Depends(require_admin_or_factory)])
async def verify_claim(claim_id: str, verify_data: ClaimVerify):
    """Verify a claim (Admin or Factory)"""
    verified_claim = await claim_crud.verify_claim(claim_id, verify_data)
    if verified_claim is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    return verified_claim


@router.put("/{claim_id}/bilty", response_model=dict, dependencies=[Depends(require_admin_or_rep)])
async def update_bilty_number(claim_id: str, bilty_data: ClaimBiltyUpdate):
    """Update bilty number and change status to Approval Pending (Admin or Rep)"""
    updated_claim = await claim_crud.update_bilty_number(claim_id, bilty_data.bilty_number)
    if updated_claim is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    return updated_claim


@router.put("/{claim_id}/approve", response_model=dict, dependencies=[Depends(require_admin_or_factory)])
async def approve_claim(claim_id: str, approve_data: ClaimApprove):
    """Approve a claim and change status to Approved (Admin or Factory)"""
    approved_claim = await claim_crud.approve_claim(claim_id, approve_data)
    if approved_claim is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    return approved_claim


@router.delete("/{claim_id}", dependencies=[Depends(require_admin_or_rep)])
async def delete_claim(claim_id: str):
    """Delete claim (Admin or Rep)"""
    deleted = await claim_crud.delete_claim(claim_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Claim not found"
        )
    return {"message": "Claim deleted successfully"}
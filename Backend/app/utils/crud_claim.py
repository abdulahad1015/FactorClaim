from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import HTTPException, status
from ..utils.crud_base import CRUDBase
from ..models.claim import Claim, ClaimCreate, ClaimUpdate, ClaimVerify, ClaimStatus, ClaimApprove
from ..utils.crud_batch import batch_crud
from ..utils.accounting import send_sale_return_email


class CRUDClaim(CRUDBase):
    """CRUD operations for Claim"""
    
    def __init__(self):
        super().__init__("claims")
    
    async def _generate_claim_id(self) -> str:
        """Generate unique claim ID as a sequential serial number (e.g., 0001, 0002, ...)"""
        # Find the latest claim ID by sorting numerically
        latest_claim = await self.collection.find_one(
            {"claim_id": {"$exists": True, "$ne": None}},
            sort=[("claim_id", -1)]
        )
        
        if latest_claim and "claim_id" in latest_claim:
            try:
                # Handle old format (CLM-DATE-XXXX) and new format (XXXX)
                claim_id_str = latest_claim["claim_id"]
                if "-" in claim_id_str:
                    last_num = int(claim_id_str.split("-")[-1])
                else:
                    last_num = int(claim_id_str)
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1
        
        return f"{next_num:04d}"
    
    async def _validate_batch_warranty(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Validate batch warranty based on production_date + warranty_period.
        Returns list of warnings for batches past warranty that aren't force_add.
        """
        warnings = []
        
        for idx, claim_item in enumerate(items):
            batch_id = claim_item.get("batch_id")
            force_add = claim_item.get("force_add", False)
            
            if not force_add:
                batch = await batch_crud.get_batch(str(batch_id))
                if batch:
                    production_date = batch.get("production_date")
                    warranty_period = batch.get("warranty_period", 12)
                    
                    if isinstance(production_date, str):
                        try:
                            production_date = datetime.fromisoformat(production_date.replace('Z', '+00:00'))
                        except (ValueError, AttributeError):
                            continue
                    
                    if production_date and isinstance(production_date, datetime):
                        age_months = int((datetime.utcnow() - production_date).days / 30)
                        if age_months > warranty_period:
                            warnings.append({
                                "item_index": idx,
                                "batch_id": str(batch_id),
                                "batch_code": batch.get("batch_code"),
                                "production_date": production_date.isoformat() if hasattr(production_date, 'isoformat') else str(production_date),
                                "warranty_period": warranty_period,
                                "age_months": age_months,
                                "message": f"Batch '{batch.get('batch_code')}' warranty has expired ({age_months} months old, warranty: {warranty_period} months)"
                            })
        
        return warnings
    
    async def create_claim(self, claim_in: ClaimCreate) -> Dict[str, Any]:
        """Create a new claim with unique claim_id and warranty validation"""
        claim_data = claim_in.dict()
        
        # Validate force_add_reason when force_add=True
        for idx, item in enumerate(claim_data.get("items", [])):
            if item.get("force_add") and not item.get("force_add_reason", "").strip():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Item {idx + 1}: force_add_reason is required when force_add is True"
                )
        
        # Validate batch warranty before creating claim
        warnings = await self._validate_batch_warranty(claim_data.get("items", []))
        if warnings:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "items_require_confirmation",
                    "message": "Some batches have expired warranty and require confirmation",
                    "warnings": warnings
                }
            )
        
        # Convert ObjectId fields to proper format
        if "rep_id" in claim_data:
            claim_data["rep_id"] = ObjectId(claim_data["rep_id"])
        if "merchant_id" in claim_data:
            claim_data["merchant_id"] = ObjectId(claim_data["merchant_id"])
        
        # Convert batch_ids in items
        for item in claim_data.get("items", []):
            if "batch_id" in item:
                item["batch_id"] = ObjectId(item["batch_id"])
        
        # Generate unique claim ID
        claim_data["claim_id"] = await self._generate_claim_id()
        
        # Add timestamp fields if not present
        now = datetime.utcnow()
        if "date" not in claim_data:
            claim_data["date"] = now
        if "created_at" not in claim_data:
            claim_data["created_at"] = now
        if "updated_at" not in claim_data:
            claim_data["updated_at"] = now
        if "verified" not in claim_data:
            claim_data["verified"] = False
        
        # Set default status to Bilty Pending for new claims
        if "status" not in claim_data:
            claim_data["status"] = ClaimStatus.BILTY_PENDING.value
        
        return await self.create(claim_data)
    
    async def get_claim(self, claim_id: str) -> Optional[Dict[str, Any]]:
        """Get claim by ID"""
        return await self.get(claim_id)
    
    async def get_claim_by_claim_id(self, claim_id: str) -> Optional[Dict[str, Any]]:
        """Get claim by unique claim_id (e.g., CLM-20241210-0001)"""
        claim = await self.collection.find_one({"claim_id": claim_id})
        return self.serialize_doc(claim) if claim else None
    
    async def get_claims(
        self,
        skip: int = 0,
        limit: int = 100,
        rep_id: Optional[str] = None,
        merchant_id: Optional[str] = None,
        verified: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Get claims with optional filters"""
        filter_dict = {}
        
        if rep_id:
            filter_dict["rep_id"] = ObjectId(rep_id)
        if merchant_id:
            filter_dict["merchant_id"] = ObjectId(merchant_id)
        if verified is not None:
            filter_dict["verified"] = verified
        
        return await self.get_multi(skip=skip, limit=limit, filter_dict=filter_dict)
    
    async def update_claim(
        self, 
        claim_id: str, 
        claim_in: ClaimUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update claim"""
        claim_data = claim_in.dict(exclude_unset=True)
        
        # Convert ObjectId fields if present
        if "verified_by" in claim_data and claim_data["verified_by"]:
            claim_data["verified_by"] = ObjectId(claim_data["verified_by"])
        
        # Convert batch_ids in items if present
        if "items" in claim_data:
            for item in claim_data["items"]:
                if "batch_id" in item:
                    item["batch_id"] = ObjectId(item["batch_id"])
        
        return await self.update(claim_id, claim_data)
    
    async def verify_claim(
        self, 
        claim_id: str, 
        verify_data: ClaimVerify
    ) -> Optional[Dict[str, Any]]:
        """Verify a claim with per-item approval/rejection results"""
        update_data = {
            "verified": True,
            "verified_by": ObjectId(verify_data.verified_by),
            "verified_at": datetime.utcnow(),
            "notes": verify_data.notes,
            "status": ClaimStatus.APPROVED.value,
            "updated_at": datetime.utcnow()
        }
        
        # Store per-item verification status if provided
        if verify_data.item_results:
            claim = await self.get(claim_id)
            if claim:
                items = claim.get("items", [])
                for result in verify_data.item_results:
                    for item in items:
                        if str(item.get("batch_id")) == str(result.batch_id):
                            item["verification_status"] = result.status
                            item["scanned_quantity"] = result.scanned_quantity
                            break
                update_data["items"] = items
        
        result = await self.update(claim_id, update_data)
        
        # Trigger sale return email after successful verification
        if result:
            verified_claim = await self.get(claim_id)
            if verified_claim:
                await send_sale_return_email(verified_claim)
        
        return result
    
    async def delete_claim(self, claim_id: str) -> bool:
        """Delete claim"""
        return await self.delete(claim_id)
    
    async def get_claims_by_rep(self, rep_id: str) -> List[Dict[str, Any]]:
        """Get all claims for a representative"""
        filter_dict = {"rep_id": ObjectId(rep_id)}
        return await self.get_multi(filter_dict=filter_dict)
    
    async def get_unverified_claims(self) -> List[Dict[str, Any]]:
        """Get all unverified claims excluding Bilty Pending (factory only sees claims with bilty added)"""
        filter_dict = {"verified": False, "status": {"$ne": ClaimStatus.BILTY_PENDING.value}}
        return await self.get_multi(filter_dict=filter_dict)
    
    async def update_bilty_number(
        self, 
        claim_id: str, 
        bilty_number: str
    ) -> Optional[Dict[str, Any]]:
        """Update bilty number and change status to Approval Pending"""
        update_data = {
            "bilty_number": bilty_number,
            "status": ClaimStatus.APPROVAL_PENDING.value,
            "updated_at": datetime.utcnow()
        }
        
        return await self.update(claim_id, update_data)
    
    async def approve_claim(
        self, 
        claim_id: str, 
        approve_data: ClaimApprove
    ) -> Optional[Dict[str, Any]]:
        """Approve a claim and change status to Approved"""
        update_data = {
            "status": ClaimStatus.APPROVED.value,
            "verified": True,
            "verified_by": ObjectId(approve_data.verified_by),
            "verified_at": datetime.utcnow(),
            "notes": approve_data.notes,
            "updated_at": datetime.utcnow()
        }
        
        return await self.update(claim_id, update_data)


# Create instance
claim_crud = CRUDClaim()
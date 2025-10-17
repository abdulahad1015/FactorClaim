from typing import Any, Dict, List, Optional
from datetime import datetime
from bson import ObjectId
from ..utils.crud_base import CRUDBase
from ..models.claim import Claim, ClaimCreate, ClaimUpdate, ClaimVerify


class CRUDClaim(CRUDBase):
    """CRUD operations for Claim"""
    
    def __init__(self):
        super().__init__("claims")
    
    async def create_claim(self, claim_in: ClaimCreate) -> Dict[str, Any]:
        """Create a new claim"""
        claim_data = claim_in.dict()
        # Convert ObjectId fields to proper format
        if "rep_id" in claim_data:
            claim_data["rep_id"] = ObjectId(claim_data["rep_id"])
        if "merchant_id" in claim_data:
            claim_data["merchant_id"] = ObjectId(claim_data["merchant_id"])
        
        # Convert item_ids in items
        for item in claim_data.get("items", []):
            if "item_id" in item:
                item["item_id"] = ObjectId(item["item_id"])
        
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
        
        return await self.create(claim_data)
    
    async def get_claim(self, claim_id: str) -> Optional[Dict[str, Any]]:
        """Get claim by ID"""
        return await self.get(claim_id)
    
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
        
        # Convert item_ids in items if present
        if "items" in claim_data:
            for item in claim_data["items"]:
                if "item_id" in item:
                    item["item_id"] = ObjectId(item["item_id"])
        
        return await self.update(claim_id, claim_data)
    
    async def verify_claim(
        self, 
        claim_id: str, 
        verify_data: ClaimVerify
    ) -> Optional[Dict[str, Any]]:
        """Verify a claim"""
        update_data = {
            "verified": True,
            "verified_by": ObjectId(verify_data.verified_by),
            "verified_at": datetime.utcnow(),
            "notes": verify_data.notes,
            "updated_at": datetime.utcnow()
        }
        
        return await self.update(claim_id, update_data)
    
    async def delete_claim(self, claim_id: str) -> bool:
        """Delete claim"""
        return await self.delete(claim_id)
    
    async def get_claims_by_rep(self, rep_id: str) -> List[Dict[str, Any]]:
        """Get all claims for a representative"""
        filter_dict = {"rep_id": ObjectId(rep_id)}
        return await self.get_multi(filter_dict=filter_dict)
    
    async def get_unverified_claims(self) -> List[Dict[str, Any]]:
        """Get all unverified claims"""
        filter_dict = {"verified": False}
        return await self.get_multi(filter_dict=filter_dict)


# Create instance
claim_crud = CRUDClaim()
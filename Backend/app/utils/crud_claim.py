from typing import Any, Dict, List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from fastapi import HTTPException, status
from ..utils.crud_base import CRUDBase
from ..models.claim import Claim, ClaimCreate, ClaimUpdate, ClaimVerify
from ..utils.crud_item import item_crud


class CRUDClaim(CRUDBase):
    """CRUD operations for Claim"""
    
    def __init__(self):
        super().__init__("claims")
    
    async def _generate_claim_id(self) -> str:
        """Generate unique claim ID in format CLM-YYYYMMDD-XXXX"""
        today = datetime.utcnow().strftime("%Y%m%d")
        prefix = f"CLM-{today}-"
        
        # Find the latest claim ID for today
        latest_claim = await self.collection.find_one(
            {"claim_id": {"$regex": f"^{prefix}"}},
            sort=[("claim_id", -1)]
        )
        
        if latest_claim and "claim_id" in latest_claim:
            # Extract the sequence number and increment
            try:
                last_num = int(latest_claim["claim_id"].split("-")[-1])
                next_num = last_num + 1
            except (ValueError, IndexError):
                next_num = 1
        else:
            next_num = 1
        
        return f"{prefix}{next_num:04d}"
    
    async def _validate_item_production_dates(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Validate item production dates against 15-month threshold.
        Returns list of warnings for items older than 15 months that aren't force_add.
        """
        warnings = []
        fifteen_months_ago = datetime.utcnow() - timedelta(days=15*30)  # Approximate 15 months
        
        for idx, claim_item in enumerate(items):
            item_id = claim_item.get("item_id")
            force_add = claim_item.get("force_add", False)
            
            if not force_add:
                # Get item details to check production date
                item = await item_crud.get_item(str(item_id))
                if item:
                    production_date = item.get("production_date")
                    
                    # Convert string to datetime if needed
                    if isinstance(production_date, str):
                        try:
                            production_date = datetime.fromisoformat(production_date.replace('Z', '+00:00'))
                        except (ValueError, AttributeError):
                            continue  # Skip if date parsing fails
                    
                    if production_date and isinstance(production_date, datetime) and production_date < fifteen_months_ago:
                        warnings.append({
                            "item_index": idx,
                            "item_id": str(item_id),
                            "model_name": item.get("model_name"),
                            "batch": item.get("batch"),
                            "production_date": production_date.isoformat() if hasattr(production_date, 'isoformat') else str(production_date),
                            "age_months": int((datetime.utcnow() - production_date).days / 30),
                            "message": f"Item '{item.get('model_name')}' (batch: {item.get('batch')}) is older than 15 months"
                        })
        
        return warnings
    
    async def create_claim(self, claim_in: ClaimCreate) -> Dict[str, Any]:
        """Create a new claim with unique claim_id and production date validation"""
        claim_data = claim_in.dict()
        
        # Validate item production dates before creating claim
        warnings = await self._validate_item_production_dates(claim_data.get("items", []))
        if warnings:
            # Raise an error with the warnings so the frontend can prompt the user
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "items_require_confirmation",
                    "message": "Some items are older than 15 months and require confirmation",
                    "warnings": warnings
                }
            )
        
        # Convert ObjectId fields to proper format
        if "rep_id" in claim_data:
            claim_data["rep_id"] = ObjectId(claim_data["rep_id"])
        if "merchant_id" in claim_data:
            claim_data["merchant_id"] = ObjectId(claim_data["merchant_id"])
        
        # Convert item_ids in items
        for item in claim_data.get("items", []):
            if "item_id" in item:
                item["item_id"] = ObjectId(item["item_id"])
        
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
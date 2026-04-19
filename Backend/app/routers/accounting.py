from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.responses import StreamingResponse
import io
from ..utils.accounting import generate_sale_return_csv
from ..utils.crud_claim import claim_crud
from ..utils.dependencies import get_current_user, require_admin_or_factory, require_admin_or_warehouse

router = APIRouter()


@router.get("/sale-return/{claim_id}/csv")
async def download_sale_return_csv(
    claim_id: str,
    current_user=Depends(require_admin_or_warehouse)
):
    """Download sale return CSV for a verified claim"""
    claim = await claim_crud.get_claim(claim_id)
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
    
    if not claim.get("verified"):
        raise HTTPException(status_code=400, detail="Claim has not been verified yet")
    
    csv_content = await generate_sale_return_csv(claim)
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=sale_return_{claim.get('claim_id', claim_id)}.csv"
        }
    )

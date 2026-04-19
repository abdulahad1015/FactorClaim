import csv
import io
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders
from datetime import datetime
from typing import Dict, Any, List, Optional
from bson import ObjectId
from ..core.config import settings
from ..core.database import get_database


async def generate_sale_return_csv(claim: Dict[str, Any]) -> str:
    """Generate CSV content for a verified claim's sale return"""
    db = get_database()
    
    rows = []
    merchant = None
    if claim.get("merchant_id"):
        merchant = await db["merchants"].find_one({"_id": ObjectId(str(claim["merchant_id"]))})
    merchant_name = merchant["name"] if merchant else "Unknown"
    
    for item in claim.get("items", []):
        batch_id = item.get("batch_id")
        batch = await db["batches"].find_one({"_id": ObjectId(str(batch_id))}) if batch_id else None
        
        model_name = "Unknown"
        if batch and batch.get("model_id"):
            model = await db["models"].find_one({"_id": ObjectId(str(batch["model_id"]))})
            if model:
                model_name = f"{model.get('name', '')} {model.get('wattage', '')}W"
        
        verified_qty = item.get("scanned_quantity", item.get("quantity", 0))
        
        rows.append({
            "MerchantName": merchant_name,
            "ModelName": model_name,
            "VerifiedQty": verified_qty,
            "BiltyNumber": claim.get("bilty_number", ""),
            "ClaimID": claim.get("claim_id", ""),
            "VerifiedDate": claim.get("verified_at", datetime.utcnow()).strftime("%Y-%m-%d") if isinstance(claim.get("verified_at"), datetime) else str(claim.get("verified_at", ""))
        })
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=["MerchantName", "ModelName", "VerifiedQty", "BiltyNumber", "ClaimID", "VerifiedDate"])
    writer.writeheader()
    writer.writerows(rows)
    return output.getvalue()


async def send_sale_return_email(claim: Dict[str, Any]) -> bool:
    """Send sale return CSV via email to accounts"""
    if not settings.accounts_email or not settings.smtp_host:
        return False
    
    try:
        csv_content = await generate_sale_return_csv(claim)
        claim_id = claim.get("claim_id", "unknown")
        
        msg = MIMEMultipart()
        msg["From"] = settings.smtp_user
        msg["To"] = settings.accounts_email
        msg["Subject"] = f"Sale Return - Claim #{claim_id} - {datetime.utcnow().strftime('%Y-%m-%d')}"
        
        body = f"Please find attached the sale return details for Claim #{claim_id}.\n\nThis is an automated message from FactorClaim."
        msg.attach(MIMEText(body, "plain"))
        
        attachment = MIMEBase("application", "octet-stream")
        attachment.set_payload(csv_content.encode("utf-8"))
        encoders.encode_base64(attachment)
        attachment.add_header(
            "Content-Disposition",
            f"attachment; filename=sale_return_{claim_id}_{datetime.utcnow().strftime('%Y%m%d')}.csv"
        )
        msg.attach(attachment)
        
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.send_message(msg)
        
        return True
    except Exception as e:
        print(f"Failed to send sale return email: {e}")
        return False

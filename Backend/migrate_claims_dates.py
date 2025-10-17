"""
Migration script to add date field to existing claims that don't have it.
Run this once to fix existing claims in the database.
"""
import asyncio
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


async def migrate_claims():
    """Add date field to claims that don't have it"""
    # Connect to database
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    claims_collection = db["claims"]
    
    # Find claims without a date field
    claims_without_date = await claims_collection.count_documents({"date": {"$exists": False}})
    print(f"Found {claims_without_date} claims without a date field")
    
    if claims_without_date == 0:
        print("All claims already have a date field!")
        return
    
    # Update claims without date field
    # Use created_at if it exists, otherwise use current time
    result = await claims_collection.update_many(
        {"date": {"$exists": False}},
        [{
            "$set": {
                "date": {
                    "$ifNull": ["$created_at", datetime.utcnow()]
                }
            }
        }]
    )
    
    print(f"Updated {result.modified_count} claims with date field")
    
    # Also ensure created_at and updated_at exist
    claims_without_created = await claims_collection.count_documents({"created_at": {"$exists": False}})
    if claims_without_created > 0:
        print(f"Found {claims_without_created} claims without created_at field")
        await claims_collection.update_many(
            {"created_at": {"$exists": False}},
            {"$set": {"created_at": datetime.utcnow()}}
        )
        print(f"Added created_at to {claims_without_created} claims")
    
    claims_without_updated = await claims_collection.count_documents({"updated_at": {"$exists": False}})
    if claims_without_updated > 0:
        print(f"Found {claims_without_updated} claims without updated_at field")
        await claims_collection.update_many(
            {"updated_at": {"$exists": False}},
            {"$set": {"updated_at": datetime.utcnow()}}
        )
        print(f"Added updated_at to {claims_without_updated} claims")
    
    print("Migration completed successfully!")
    client.close()


if __name__ == "__main__":
    asyncio.run(migrate_claims())

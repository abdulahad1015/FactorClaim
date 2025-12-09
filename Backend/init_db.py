"""
Database Initialization Script for FactorClaim
Run this script to initialize your MongoDB Atlas database with required collections and indexes.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings
from app.utils.auth import auth_utils
from datetime import datetime


async def init_database():
    """Initialize database with collections and indexes"""
    print("🚀 Starting database initialization...")
    
    # Connect to MongoDB
    client = AsyncIOMotorClient(settings.mongodb_url)
    db = client[settings.database_name]
    
    try:
        # Test connection
        await client.admin.command('ping')
        print("✅ Connected to MongoDB Atlas successfully!")
        
        # Create collections and indexes
        print("\n📦 Creating collections and indexes...")
        
        # Users collection
        users_collection = db["users"]
        await users_collection.create_index("email", unique=True)
        print("✅ Created 'users' collection with indexes")
        
        # Items collection
        items_collection = db["items"]
        await items_collection.create_index("item_code", unique=True)
        await items_collection.create_index("merchant_id")
        print("✅ Created 'items' collection with indexes")
        
        # Merchants collection
        merchants_collection = db["merchants"]
        await merchants_collection.create_index("merchant_code", unique=True)
        print("✅ Created 'merchants' collection with indexes")
        
        # Claims collection
        claims_collection = db["claims"]
        await claims_collection.create_index("claim_number", unique=True)
        await claims_collection.create_index("merchant_id")
        await claims_collection.create_index("rep_id")
        await claims_collection.create_index("status")
        print("✅ Created 'claims' collection with indexes")
        
        # Reps collection
        reps_collection = db["reps"]
        await reps_collection.create_index("rep_code", unique=True)
        print("✅ Created 'reps' collection with indexes")
        
        # Create default admin user if not exists
        print("\n👤 Creating default admin user...")
        admin_exists = await users_collection.find_one({"email": "admin@factorclaim.com"})
        
        if not admin_exists:
            admin_user = {
                "name": "System Administrator",
                "email": "admin@factorclaim.com",
                "contact_no": "0000000000",
                "type": "Admin",
                "password_hash": auth_utils.get_password_hash("admin123"),
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = await users_collection.insert_one(admin_user)
            print(f"✅ Admin user created with ID: {result.inserted_id}")
            print("   Email: admin@factorclaim.com")
            print("   Password: admin123")
            print("   ⚠️  IMPORTANT: Change this password after first login!")
        else:
            print("ℹ️  Admin user already exists")
        
        # Optional: Create sample data
        create_sample = input("\n❓ Do you want to create sample data? (yes/no): ").lower()
        
        if create_sample in ['yes', 'y']:
            await create_sample_data(db)
        
        print("\n✨ Database initialization completed successfully!")
        print(f"📊 Database: {settings.database_name}")
        print(f"🌐 Connection: {settings.mongodb_url.split('@')[1] if '@' in settings.mongodb_url else 'localhost'}")
        
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
        raise
    finally:
        client.close()
        print("\n🔌 Disconnected from MongoDB")


async def create_sample_data(db):
    """Create sample data for testing"""
    print("\n📝 Creating sample data...")
    
    # Sample merchant
    merchants_collection = db["merchants"]
    merchant_exists = await merchants_collection.find_one({"merchant_code": "MERCH001"})
    
    if not merchant_exists:
        sample_merchant = {
            "merchant_code": "MERCH001",
            "name": "Sample Merchant Ltd",
            "contact_person": "John Doe",
            "email": "contact@samplemerchant.com",
            "phone": "+1234567890",
            "address": "123 Business Street",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await merchants_collection.insert_one(sample_merchant)
        merchant_id = str(result.inserted_id)
        print(f"✅ Sample merchant created: {sample_merchant['name']}")
    else:
        merchant_id = str(merchant_exists["_id"])
        print("ℹ️  Sample merchant already exists")
    
    # Sample rep
    reps_collection = db["reps"]
    rep_exists = await reps_collection.find_one({"rep_code": "REP001"})
    
    if not rep_exists:
        sample_rep = {
            "rep_code": "REP001",
            "name": "Jane Smith",
            "email": "jane.smith@example.com",
            "phone": "+1234567891",
            "is_active": True,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await reps_collection.insert_one(sample_rep)
        rep_id = str(result.inserted_id)
        print(f"✅ Sample rep created: {sample_rep['name']}")
    else:
        rep_id = str(rep_exists["_id"])
        print("ℹ️  Sample rep already exists")
    
    # Sample items
    items_collection = db["items"]
    item_exists = await items_collection.find_one({"item_code": "ITEM001"})
    
    if not item_exists:
        sample_items = [
            {
                "item_code": "ITEM001",
                "name": "Sample Product A",
                "description": "High quality product",
                "merchant_id": merchant_id,
                "unit_price": 99.99,
                "category": "Electronics",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            },
            {
                "item_code": "ITEM002",
                "name": "Sample Product B",
                "description": "Premium product",
                "merchant_id": merchant_id,
                "unit_price": 149.99,
                "category": "Electronics",
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
        ]
        await items_collection.insert_many(sample_items)
        print(f"✅ Created {len(sample_items)} sample items")
    else:
        print("ℹ️  Sample items already exist")
    
    print("✅ Sample data creation completed!")


if __name__ == "__main__":
    print("""
    ╔════════════════════════════════════════════╗
    ║   FactorClaim Database Initialization     ║
    ╚════════════════════════════════════════════╝
    """)
    asyncio.run(init_database())

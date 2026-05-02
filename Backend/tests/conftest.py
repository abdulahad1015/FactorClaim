"""
Shared test fixtures for FactorClaim integration tests.

Uses mongomock-motor to provide an in-memory MongoDB that requires no
external service, making it safe for CI / GitHub Actions.
"""
import asyncio
from datetime import datetime, timedelta

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from bson import ObjectId

# ---------------------------------------------------------------------------
# Override database *before* the app module is imported so the app uses the
# test database everywhere (including its startup event).
# ---------------------------------------------------------------------------
from mongomock_motor import AsyncMongoMockClient

import app.core.database as _db_module
from app.core.config import settings
from app.utils.auth import auth_utils


# ---- helpers ----------------------------------------------------------------

def _make_oid() -> str:
    return str(ObjectId())


# ---- fixtures ---------------------------------------------------------------

@pytest.fixture(scope="session")
def event_loop():
    """Create a single event loop for the whole test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def mongo_client():
    """Session-scoped in-memory Mongo client."""
    client = AsyncMongoMockClient()
    yield client
    client.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_test_db(mongo_client):
    """
    Before every test:
      1. Point the app's database module at a fresh test DB.
      2. Drop all collections so tests are isolated.
    """
    db = mongo_client["factorclaim_test"]
    _db_module.db.client = mongo_client
    _db_module.db.database = db

    # Wipe all collections before each test
    for name in await db.list_collection_names():
        await db[name].drop()

    yield db


@pytest_asyncio.fixture
async def client(setup_test_db):
    """Async HTTP test client that talks to the FastAPI app."""
    from main import app  # import here so DB override is applied

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def admin_user(setup_test_db):
    """Insert an admin user and return (user_doc, token)."""
    db = setup_test_db
    password = "testadmin123"
    user_doc = {
        "_id": ObjectId(),
        "name": "Test Admin",
        "type": "Admin",
        "contact_no": "0300000001",
        "email": "admin@test.com",
        "password_hash": auth_utils.get_password_hash(password),
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db["users"].insert_one(user_doc)
    token_data = auth_utils.create_token_for_user(user_doc)
    return user_doc, token_data["access_token"]


@pytest_asyncio.fixture
async def rep_user(setup_test_db):
    """Insert a Rep user and return (user_doc, token)."""
    db = setup_test_db
    user_doc = {
        "_id": ObjectId(),
        "name": "Test Rep",
        "type": "Rep",
        "contact_no": "0300000002",
        "email": "rep@test.com",
        "password_hash": auth_utils.get_password_hash("testrep123"),
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db["users"].insert_one(user_doc)
    token_data = auth_utils.create_token_for_user(user_doc)
    return user_doc, token_data["access_token"]


@pytest_asyncio.fixture
async def factory_user(setup_test_db):
    """Insert a Factory user and return (user_doc, token)."""
    db = setup_test_db
    user_doc = {
        "_id": ObjectId(),
        "name": "Test Factory",
        "type": "Factory",
        "contact_no": "0300000003",
        "email": "factory@test.com",
        "password_hash": auth_utils.get_password_hash("testfactory123"),
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db["users"].insert_one(user_doc)
    token_data = auth_utils.create_token_for_user(user_doc)
    return user_doc, token_data["access_token"]


@pytest_asyncio.fixture
async def warehouse_user(setup_test_db):
    """Insert a Sales Manager (warehouse) user and return (user_doc, token)."""
    db = setup_test_db
    user_doc = {
        "_id": ObjectId(),
        "name": "Test Warehouse",
        "type": "Sales Manager",
        "contact_no": "0300000004",
        "email": "warehouse@test.com",
        "password_hash": auth_utils.get_password_hash("testwarehouse123"),
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db["users"].insert_one(user_doc)
    token_data = auth_utils.create_token_for_user(user_doc)
    return user_doc, token_data["access_token"]


def auth_header(token: str) -> dict:
    """Convenience to build Authorization header."""
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def sample_product_type(setup_test_db):
    """Insert a product type and return the document."""
    db = setup_test_db
    doc = {
        "_id": ObjectId(),
        "name": "LED Bulb",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db["product_types"].insert_one(doc)
    return doc


@pytest_asyncio.fixture
async def sample_product_model(setup_test_db, sample_product_type):
    """Insert a product model and return the document."""
    db = setup_test_db
    doc = {
        "_id": ObjectId(),
        "name": "LED-100W",
        "wattage": 100.0,
        "product_type_id": sample_product_type["_id"],
        "notes": "",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db["models"].insert_one(doc)
    return doc


@pytest_asyncio.fixture
async def sample_supplier(setup_test_db):
    """Insert a supplier and return the document."""
    db = setup_test_db
    doc = {
        "_id": ObjectId(),
        "name": "Test Supplier Co",
        "contact": "0311111111",
        "email": "supplier@test.com",
        "address": "123 Test St",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db["suppliers"].insert_one(doc)
    return doc


@pytest_asyncio.fixture
async def sample_batch(setup_test_db, sample_product_model, sample_supplier, admin_user):
    """Insert a batch and return the document."""
    db = setup_test_db
    user_doc, _ = admin_user
    doc = {
        "_id": ObjectId(),
        "batch_code": "B-TEST-001",
        "model_id": sample_product_model["_id"],
        "colour": "Warm White",
        "quantity": 500,
        "production_date": datetime.utcnow() - timedelta(days=30),
        "warranty_period": 12,
        "supplier_id": sample_supplier["_id"],
        "contractor": "Test Contractor",
        "supervisor_id": user_doc["_id"],
        "notes": "Test batch",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db["batches"].insert_one(doc)
    return doc


@pytest_asyncio.fixture
async def sample_merchant(setup_test_db):
    """Insert a merchant and return the document."""
    db = setup_test_db
    doc = {
        "_id": ObjectId(),
        "name": "Test Store",
        "address": "456 Market Rd",
        "province": "Punjab",
        "city": "Lahore",
        "contact": "0322222222",
        "email": "store@test.com",
        "is_active": True,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db["merchants"].insert_one(doc)
    return doc


@pytest_asyncio.fixture
async def sample_claim(setup_test_db, rep_user, sample_merchant, sample_batch):
    """Insert a claim and return the document."""
    db = setup_test_db
    user_doc, _ = rep_user
    doc = {
        "_id": ObjectId(),
        "claim_id": "CLM-TEST-0001",
        "rep_id": user_doc["_id"],
        "merchant_id": sample_merchant["_id"],
        "date": datetime.utcnow(),
        "items": [
            {
                "batch_id": sample_batch["_id"],
                "quantity": 5,
                "notes": "defective",
                "force_add": False,
                "force_add_reason": "",
            }
        ],
        "status": "Bilty Pending",
        "bilty_number": None,
        "verified": False,
        "verified_by": None,
        "verified_at": None,
        "notes": "Test claim",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }
    await db["claims"].insert_one(doc)
    return doc

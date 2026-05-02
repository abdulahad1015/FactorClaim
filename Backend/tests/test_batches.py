"""Integration tests for batch endpoints."""
import pytest
from datetime import datetime
from bson import ObjectId
from tests.conftest import auth_header


class TestBatches:
    """Test /api/batches endpoints."""

    # ---- CREATE ----
    @pytest.mark.asyncio
    async def test_create_batch(
        self, client, admin_user, sample_product_model, sample_supplier
    ):
        user_doc, token = admin_user
        resp = await client.post("/api/batches/", json={
            "batch_code": "B-NEW-001",
            "model_id": str(sample_product_model["_id"]),
            "colour": "Cool White",
            "quantity": 200,
            "production_date": datetime.utcnow().isoformat(),
            "warranty_period": 12,
            "supplier_id": str(sample_supplier["_id"]),
            "contractor": "New Contractor",
            "supervisor_id": str(user_doc["_id"]),
            "notes": "CI test",
        }, headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["batch_code"] == "B-NEW-001"
        assert data["quantity"] == 200

    @pytest.mark.asyncio
    async def test_create_batch_missing_required_fields(self, client, admin_user):
        """All required fields must be present."""
        _, token = admin_user
        resp = await client.post("/api/batches/", json={
            "batch_code": "B-FAIL",
        }, headers=auth_header(token))
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_create_batch_forbidden_for_rep(
        self, client, rep_user, sample_product_model, sample_supplier, admin_user
    ):
        user_doc, _ = admin_user
        _, token = rep_user
        resp = await client.post("/api/batches/", json={
            "batch_code": "B-NOREP",
            "model_id": str(sample_product_model["_id"]),
            "colour": "Red",
            "quantity": 10,
            "production_date": datetime.utcnow().isoformat(),
            "warranty_period": 6,
            "supplier_id": str(sample_supplier["_id"]),
            "contractor": "X",
            "supervisor_id": str(user_doc["_id"]),
        }, headers=auth_header(token))
        assert resp.status_code == 403

    # ---- READ ----
    @pytest.mark.asyncio
    async def test_list_batches(self, client, admin_user, sample_batch):
        _, token = admin_user
        resp = await client.get("/api/batches/", headers=auth_header(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    @pytest.mark.asyncio
    async def test_get_batch_by_id(self, client, admin_user, sample_batch):
        _, token = admin_user
        bid = str(sample_batch["_id"])
        resp = await client.get(f"/api/batches/{bid}", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["batch_code"] == "B-TEST-001"

    @pytest.mark.asyncio
    async def test_get_batch_by_barcode(self, client, admin_user, sample_batch):
        _, token = admin_user
        resp = await client.get(
            f"/api/batches/barcode/{sample_batch['batch_code']}",
            headers=auth_header(token),
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_batch_not_found(self, client, admin_user):
        _, token = admin_user
        resp = await client.get(f"/api/batches/{ObjectId()}", headers=auth_header(token))
        assert resp.status_code == 404

    # ---- UPDATE ----
    @pytest.mark.asyncio
    async def test_update_batch(self, client, admin_user, sample_batch):
        _, token = admin_user
        bid = str(sample_batch["_id"])
        resp = await client.put(f"/api/batches/{bid}", json={
            "colour": "Blue",
        }, headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["colour"] == "Blue"

    # ---- WARRANTY CHECK ----
    @pytest.mark.asyncio
    async def test_check_warranty(self, client, admin_user, sample_batch):
        _, token = admin_user
        bid = str(sample_batch["_id"])
        resp = await client.get(f"/api/batches/{bid}/check-warranty", headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert "is_expired" in data
        assert "age_months" in data

    # ---- DELETE with referential integrity ----
    @pytest.mark.asyncio
    async def test_delete_batch_blocked_by_claim(
        self, client, admin_user, sample_claim
    ):
        """Batch referenced in a claim → cannot delete."""
        _, token = admin_user
        batch_id = str(sample_claim["items"][0]["batch_id"])
        resp = await client.delete(f"/api/batches/{batch_id}", headers=auth_header(token))
        assert resp.status_code == 400
        assert "cannot delete" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_delete_batch_success(
        self, client, admin_user, sample_product_model, sample_supplier
    ):
        user_doc, token = admin_user
        create_resp = await client.post("/api/batches/", json={
            "batch_code": "B-DEL-001",
            "model_id": str(sample_product_model["_id"]),
            "colour": "Green",
            "quantity": 10,
            "production_date": datetime.utcnow().isoformat(),
            "warranty_period": 6,
            "supplier_id": str(sample_supplier["_id"]),
            "contractor": "Del Co",
            "supervisor_id": str(user_doc["_id"]),
        }, headers=auth_header(token))
        bid = create_resp.json()["_id"]
        resp = await client.delete(f"/api/batches/{bid}", headers=auth_header(token))
        assert resp.status_code == 200

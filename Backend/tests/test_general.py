"""Integration tests for health / root endpoints and cross-cutting concerns."""
import pytest
from tests.conftest import auth_header


class TestHealthAndRoot:
    """Basic smoke tests."""

    @pytest.mark.asyncio
    async def test_root(self, client):
        resp = await client.get("/")
        assert resp.status_code == 200
        data = resp.json()
        assert "FactorClaim" in data.get("message", "")

    @pytest.mark.asyncio
    async def test_health(self, client):
        resp = await client.get("/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "healthy"


class TestUnauthorized:
    """Requests without a token should fail with 401/403."""

    @pytest.mark.asyncio
    async def test_users_no_token(self, client):
        resp = await client.get("/api/users/")
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_batches_no_token(self, client):
        resp = await client.get("/api/batches/")
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_claims_no_token(self, client):
        resp = await client.get("/api/claims/")
        assert resp.status_code == 403


class TestRoleEnforcement:
    """Verify role-based access control across endpoints."""

    @pytest.mark.asyncio
    async def test_rep_cannot_create_batch(
        self, client, rep_user, sample_product_model, sample_supplier, admin_user
    ):
        user_doc, _ = admin_user
        _, token = rep_user
        resp = await client.post("/api/batches/", json={
            "batch_code": "B-ROLE",
            "model_id": str(sample_product_model["_id"]),
            "colour": "Red",
            "quantity": 10,
            "production_date": "2025-01-01T00:00:00",
            "warranty_period": 6,
            "supplier_id": str(sample_supplier["_id"]),
            "contractor": "X",
            "supervisor_id": str(user_doc["_id"]),
        }, headers=auth_header(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_factory_cannot_create_claim(
        self, client, factory_user, sample_merchant, sample_batch
    ):
        user_doc, token = factory_user
        resp = await client.post("/api/claims/", json={
            "rep_id": str(user_doc["_id"]),
            "merchant_id": str(sample_merchant["_id"]),
            "items": [{"batch_id": str(sample_batch["_id"]), "quantity": 1}],
        }, headers=auth_header(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_rep_cannot_manage_suppliers(self, client, rep_user):
        _, token = rep_user
        resp = await client.post("/api/suppliers/", json={
            "name": "Bad Supplier",
        }, headers=auth_header(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_rep_cannot_manage_product_types(self, client, rep_user):
        _, token = rep_user
        resp = await client.post("/api/product-types/", json={
            "name": "Bad Type",
        }, headers=auth_header(token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_warehouse_can_list_users(self, client, warehouse_user):
        _, token = warehouse_user
        resp = await client.get("/api/users/", headers=auth_header(token))
        assert resp.status_code == 200


class TestReferentialIntegrity:
    """End-to-end referential integrity checks across all entities."""

    @pytest.mark.asyncio
    async def test_cannot_delete_product_type_with_model(
        self, client, admin_user, sample_product_model
    ):
        _, token = admin_user
        ptid = str(sample_product_model["product_type_id"])
        resp = await client.delete(f"/api/product-types/{ptid}", headers=auth_header(token))
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_cannot_delete_model_with_batch(
        self, client, admin_user, sample_batch
    ):
        _, token = admin_user
        mid = str(sample_batch["model_id"])
        resp = await client.delete(f"/api/models/{mid}", headers=auth_header(token))
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_cannot_delete_supplier_with_batch(
        self, client, admin_user, sample_batch
    ):
        _, token = admin_user
        sid = str(sample_batch["supplier_id"])
        resp = await client.delete(f"/api/suppliers/{sid}", headers=auth_header(token))
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_cannot_delete_batch_with_claim(
        self, client, admin_user, sample_claim
    ):
        _, token = admin_user
        bid = str(sample_claim["items"][0]["batch_id"])
        resp = await client.delete(f"/api/batches/{bid}", headers=auth_header(token))
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_cannot_delete_merchant_with_claim(
        self, client, admin_user, sample_claim
    ):
        _, token = admin_user
        mid = str(sample_claim["merchant_id"])
        resp = await client.delete(f"/api/merchants/{mid}", headers=auth_header(token))
        assert resp.status_code == 400

    @pytest.mark.asyncio
    async def test_cannot_delete_user_with_batch(
        self, client, admin_user, sample_batch
    ):
        """Admin user is supervisor on sample_batch."""
        user_doc, token = admin_user
        resp = await client.delete(
            f"/api/users/{user_doc['_id']}", headers=auth_header(token)
        )
        assert resp.status_code == 400

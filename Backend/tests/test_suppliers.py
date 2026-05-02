"""Integration tests for supplier endpoints."""
import pytest
from bson import ObjectId
from tests.conftest import auth_header


class TestSuppliers:
    """Test /api/suppliers endpoints."""

    # ---- CREATE ----
    @pytest.mark.asyncio
    async def test_create_supplier(self, client, admin_user):
        _, token = admin_user
        resp = await client.post("/api/suppliers/", json={
            "name": "Acme Supplies",
            "contact": "0312345678",
            "email": "acme@test.com",
            "address": "Industrial Zone A",
        }, headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "Acme Supplies"

    @pytest.mark.asyncio
    async def test_create_supplier_forbidden_for_rep(self, client, rep_user):
        _, token = rep_user
        resp = await client.post("/api/suppliers/", json={
            "name": "Sneaky Supplies",
        }, headers=auth_header(token))
        assert resp.status_code == 403

    # ---- READ ----
    @pytest.mark.asyncio
    async def test_list_suppliers(self, client, admin_user, sample_supplier):
        _, token = admin_user
        resp = await client.get("/api/suppliers/", headers=auth_header(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    @pytest.mark.asyncio
    async def test_get_supplier_by_id(self, client, admin_user, sample_supplier):
        _, token = admin_user
        sid = str(sample_supplier["_id"])
        resp = await client.get(f"/api/suppliers/{sid}", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Supplier Co"

    @pytest.mark.asyncio
    async def test_get_supplier_not_found(self, client, admin_user):
        _, token = admin_user
        resp = await client.get(f"/api/suppliers/{ObjectId()}", headers=auth_header(token))
        assert resp.status_code == 404

    # ---- UPDATE ----
    @pytest.mark.asyncio
    async def test_update_supplier(self, client, admin_user, sample_supplier):
        _, token = admin_user
        sid = str(sample_supplier["_id"])
        resp = await client.put(f"/api/suppliers/{sid}", json={
            "name": "Updated Supplier",
        }, headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated Supplier"

    # ---- DELETE with referential integrity ----
    @pytest.mark.asyncio
    async def test_delete_supplier_blocked_by_batch(self, client, admin_user, sample_batch):
        """Supplier referenced by batch → cannot delete."""
        _, token = admin_user
        sid = str(sample_batch["supplier_id"])
        resp = await client.delete(f"/api/suppliers/{sid}", headers=auth_header(token))
        assert resp.status_code == 400
        assert "cannot delete" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_delete_supplier_success(self, client, admin_user):
        _, token = admin_user
        create_resp = await client.post("/api/suppliers/", json={
            "name": "Deleteable",
        }, headers=auth_header(token))
        sid = create_resp.json()["_id"]
        resp = await client.delete(f"/api/suppliers/{sid}", headers=auth_header(token))
        assert resp.status_code == 200

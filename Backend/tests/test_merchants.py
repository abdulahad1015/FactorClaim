"""Integration tests for merchant endpoints."""
import pytest
from bson import ObjectId
from tests.conftest import auth_header


class TestMerchants:
    """Test /api/merchants endpoints."""

    # ---- CREATE ----
    @pytest.mark.asyncio
    async def test_create_merchant(self, client, admin_user):
        _, token = admin_user
        resp = await client.post("/api/merchants/", json={
            "name": "New Store",
            "address": "789 Main Blvd",
            "province": "Sindh",
            "city": "Karachi",
            "contact": "0321234567",
            "email": "store@test.com",
        }, headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "New Store"

    @pytest.mark.asyncio
    async def test_create_merchant_by_warehouse(self, client, warehouse_user):
        _, token = warehouse_user
        resp = await client.post("/api/merchants/", json={
            "name": "WH Store",
            "address": "999 WH Rd",
            "province": "Punjab",
            "city": "Lahore",
            "contact": "0329999999",
        }, headers=auth_header(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_create_merchant_forbidden_for_rep(self, client, rep_user):
        _, token = rep_user
        resp = await client.post("/api/merchants/", json={
            "name": "Nope",
            "address": "Nowhere",
            "province": "Punjab",
            "city": "Lahore",
            "contact": "0320000000",
        }, headers=auth_header(token))
        assert resp.status_code == 403

    # ---- READ ----
    @pytest.mark.asyncio
    async def test_list_merchants(self, client, admin_user, sample_merchant):
        _, token = admin_user
        resp = await client.get("/api/merchants/", headers=auth_header(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    @pytest.mark.asyncio
    async def test_get_merchant_by_id(self, client, admin_user, sample_merchant):
        _, token = admin_user
        mid = str(sample_merchant["_id"])
        resp = await client.get(f"/api/merchants/{mid}", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Store"

    # ---- UPDATE ----
    @pytest.mark.asyncio
    async def test_update_merchant(self, client, admin_user, sample_merchant):
        _, token = admin_user
        mid = str(sample_merchant["_id"])
        resp = await client.put(f"/api/merchants/{mid}", json={
            "name": "Renamed Store",
        }, headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Renamed Store"

    # ---- DELETE with referential integrity ----
    @pytest.mark.asyncio
    async def test_delete_merchant_blocked_by_claim(
        self, client, admin_user, sample_claim
    ):
        """Merchant referenced in a claim → cannot delete."""
        _, token = admin_user
        mid = str(sample_claim["merchant_id"])
        resp = await client.delete(f"/api/merchants/{mid}", headers=auth_header(token))
        assert resp.status_code == 400
        assert "cannot delete" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_delete_merchant_success(self, client, admin_user):
        _, token = admin_user
        create_resp = await client.post("/api/merchants/", json={
            "name": "Del Merchant",
            "address": "123 Del St",
            "province": "Sindh",
            "city": "Hyderabad",
            "contact": "0321111111",
        }, headers=auth_header(token))
        mid = create_resp.json()["_id"]
        resp = await client.delete(f"/api/merchants/{mid}", headers=auth_header(token))
        assert resp.status_code == 200

    # ---- SEARCH ----
    @pytest.mark.asyncio
    async def test_search_merchants(self, client, admin_user, sample_merchant):
        _, token = admin_user
        resp = await client.get("/api/merchants/search/Test", headers=auth_header(token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

"""Integration tests for product type endpoints."""
import pytest
from bson import ObjectId
from tests.conftest import auth_header


class TestProductTypes:
    """Test /api/product-types endpoints."""

    # ---- CREATE ----
    @pytest.mark.asyncio
    async def test_create_product_type(self, client, admin_user):
        _, token = admin_user
        resp = await client.post("/api/product-types/", json={
            "name": "Floodlight",
        }, headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Floodlight"

    @pytest.mark.asyncio
    async def test_create_product_type_forbidden_for_rep(self, client, rep_user):
        _, token = rep_user
        resp = await client.post("/api/product-types/", json={"name": "Nope"}, headers=auth_header(token))
        assert resp.status_code == 403

    # ---- READ ----
    @pytest.mark.asyncio
    async def test_list_product_types(self, client, admin_user, sample_product_type):
        _, token = admin_user
        resp = await client.get("/api/product-types/", headers=auth_header(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    @pytest.mark.asyncio
    async def test_get_product_type_by_id(self, client, admin_user, sample_product_type):
        _, token = admin_user
        ptid = str(sample_product_type["_id"])
        resp = await client.get(f"/api/product-types/{ptid}", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "LED Bulb"

    # ---- UPDATE ----
    @pytest.mark.asyncio
    async def test_update_product_type(self, client, admin_user, sample_product_type):
        _, token = admin_user
        ptid = str(sample_product_type["_id"])
        resp = await client.put(f"/api/product-types/{ptid}", json={
            "name": "Panel Light",
        }, headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Panel Light"

    # ---- DELETE with referential integrity ----
    @pytest.mark.asyncio
    async def test_delete_product_type_blocked_by_model(
        self, client, admin_user, sample_product_model
    ):
        """Product type used by model → cannot delete."""
        _, token = admin_user
        ptid = str(sample_product_model["product_type_id"])
        resp = await client.delete(f"/api/product-types/{ptid}", headers=auth_header(token))
        assert resp.status_code == 400
        assert "cannot delete" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_delete_product_type_success(self, client, admin_user):
        _, token = admin_user
        create_resp = await client.post("/api/product-types/", json={
            "name": "Deleteable Type",
        }, headers=auth_header(token))
        ptid = create_resp.json()["_id"]
        resp = await client.delete(f"/api/product-types/{ptid}", headers=auth_header(token))
        assert resp.status_code == 200

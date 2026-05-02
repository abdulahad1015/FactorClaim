"""Integration tests for product model endpoints."""
import pytest
from bson import ObjectId
from tests.conftest import auth_header


class TestProductModels:
    """Test /api/models endpoints."""

    # ---- CREATE ----
    @pytest.mark.asyncio
    async def test_create_product_model(self, client, admin_user, sample_product_type):
        _, token = admin_user
        resp = await client.post("/api/models/", json={
            "name": "LED-50W",
            "wattage": 50.0,
            "product_type_id": str(sample_product_type["_id"]),
            "notes": "test model",
        }, headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "LED-50W"
        assert data["wattage"] == 50.0

    @pytest.mark.asyncio
    async def test_create_product_model_forbidden_for_rep(self, client, rep_user, sample_product_type):
        _, token = rep_user
        resp = await client.post("/api/models/", json={
            "name": "Nope",
            "wattage": 10.0,
            "product_type_id": str(sample_product_type["_id"]),
        }, headers=auth_header(token))
        assert resp.status_code == 403

    # ---- READ ----
    @pytest.mark.asyncio
    async def test_list_product_models(self, client, admin_user, sample_product_model):
        _, token = admin_user
        resp = await client.get("/api/models/", headers=auth_header(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    @pytest.mark.asyncio
    async def test_get_product_model_by_id(self, client, admin_user, sample_product_model):
        _, token = admin_user
        mid = str(sample_product_model["_id"])
        resp = await client.get(f"/api/models/{mid}", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "LED-100W"

    # ---- UPDATE ----
    @pytest.mark.asyncio
    async def test_update_product_model(self, client, admin_user, sample_product_model):
        _, token = admin_user
        mid = str(sample_product_model["_id"])
        resp = await client.put(f"/api/models/{mid}", json={
            "name": "LED-100W-V2",
        }, headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "LED-100W-V2"

    # ---- DELETE with referential integrity ----
    @pytest.mark.asyncio
    async def test_delete_model_blocked_by_batch(
        self, client, admin_user, sample_batch
    ):
        """Model used by batch → cannot delete."""
        _, token = admin_user
        mid = str(sample_batch["model_id"])
        resp = await client.delete(f"/api/models/{mid}", headers=auth_header(token))
        assert resp.status_code == 400
        assert "cannot delete" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_delete_product_model_success(self, client, admin_user, sample_product_type):
        _, token = admin_user
        create_resp = await client.post("/api/models/", json={
            "name": "Temp Model",
            "wattage": 5.0,
            "product_type_id": str(sample_product_type["_id"]),
        }, headers=auth_header(token))
        mid = create_resp.json()["_id"]
        resp = await client.delete(f"/api/models/{mid}", headers=auth_header(token))
        assert resp.status_code == 200

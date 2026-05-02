"""Integration tests for location endpoints."""
import pytest
from bson import ObjectId
from tests.conftest import auth_header


class TestLocations:
    """Test /api/locations endpoints."""

    @pytest.mark.asyncio
    async def test_create_location(self, client, admin_user):
        _, token = admin_user
        resp = await client.post("/api/locations/", json={
            "name": "Rawalpindi",
            "province": "Punjab",
        }, headers=auth_header(token))
        assert resp.status_code == 201

    @pytest.mark.asyncio
    async def test_list_locations(self, client, admin_user, setup_test_db):
        _, token = admin_user
        await setup_test_db["locations"].insert_one({
            "name": "Lahore", "province": "Punjab", "is_active": True,
        })
        resp = await client.get("/api/locations/", headers=auth_header(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    @pytest.mark.asyncio
    async def test_get_location_by_id(self, client, admin_user, setup_test_db):
        _, token = admin_user
        loc = await setup_test_db["locations"].insert_one({
            "name": "Karachi", "province": "Sindh", "is_active": True,
        })
        resp = await client.get(f"/api/locations/{loc.inserted_id}", headers=auth_header(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_search_locations(self, client, admin_user, setup_test_db):
        _, token = admin_user
        await setup_test_db["locations"].insert_one({
            "name": "Islamabad", "province": "Islamabad Capital Territory", "is_active": True,
        })
        resp = await client.get("/api/locations/search/Islam", headers=auth_header(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_update_location(self, client, admin_user, setup_test_db):
        _, token = admin_user
        loc = await setup_test_db["locations"].insert_one({
            "name": "Old Name", "province": "Punjab", "is_active": True,
        })
        resp = await client.put(f"/api/locations/{loc.inserted_id}", json={
            "name": "New Name",
        }, headers=auth_header(token))
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_location_success(self, client, admin_user, setup_test_db):
        _, token = admin_user
        loc = await setup_test_db["locations"].insert_one({
            "name": "Delete Me", "province": "Sindh", "is_active": True,
        })
        resp = await client.delete(f"/api/locations/{loc.inserted_id}", headers=auth_header(token))
        assert resp.status_code == 200

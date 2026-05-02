"""Integration tests for user management endpoints."""
import pytest
from tests.conftest import auth_header


class TestUsers:
    """Test /api/users endpoints."""

    # ---- CREATE ----
    @pytest.mark.asyncio
    async def test_create_user(self, client, admin_user):
        _, token = admin_user
        resp = await client.post("/api/users/", json={
            "name": "New Rep",
            "type": "Rep",
            "contact_no": "0300000099",
            "email": "newrep@test.com",
            "password": "newrep123",
        }, headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "New Rep"
        assert data["type"] == "Rep"

    @pytest.mark.asyncio
    async def test_create_user_duplicate_email(self, client, admin_user):
        _, token = admin_user
        payload = {
            "name": "Dup User",
            "type": "Rep",
            "contact_no": "0300000098",
            "email": "dup@test.com",
            "password": "dupuser123",
        }
        await client.post("/api/users/", json=payload, headers=auth_header(token))
        resp = await client.post("/api/users/", json=payload, headers=auth_header(token))
        assert resp.status_code == 400
        assert "already registered" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_create_user_forbidden_for_rep(self, client, rep_user):
        _, token = rep_user
        resp = await client.post("/api/users/", json={
            "name": "Sneaky",
            "type": "Rep",
            "contact_no": "0300000097",
            "email": "sneaky@test.com",
            "password": "sneaky123",
        }, headers=auth_header(token))
        assert resp.status_code == 403

    # ---- READ ----
    @pytest.mark.asyncio
    async def test_list_users(self, client, admin_user):
        _, token = admin_user
        resp = await client.get("/api/users/", headers=auth_header(token))
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    @pytest.mark.asyncio
    async def test_get_current_user(self, client, admin_user):
        _, token = admin_user
        resp = await client.get("/api/users/me", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["email"] == "admin@test.com"

    @pytest.mark.asyncio
    async def test_get_user_by_id(self, client, admin_user):
        user_doc, token = admin_user
        uid = str(user_doc["_id"])
        resp = await client.get(f"/api/users/{uid}", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Test Admin"

    @pytest.mark.asyncio
    async def test_get_user_not_found(self, client, admin_user):
        _, token = admin_user
        from bson import ObjectId
        resp = await client.get(f"/api/users/{ObjectId()}", headers=auth_header(token))
        assert resp.status_code == 404

    # ---- UPDATE ----
    @pytest.mark.asyncio
    async def test_update_user(self, client, admin_user):
        user_doc, token = admin_user
        uid = str(user_doc["_id"])
        resp = await client.put(f"/api/users/{uid}", json={
            "name": "Admin Renamed",
        }, headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["name"] == "Admin Renamed"

    # ---- DELETE with referential integrity ----
    @pytest.mark.asyncio
    async def test_delete_user_blocked_by_batch(self, client, admin_user, sample_batch):
        """User is supervisor on a batch → delete must fail."""
        user_doc, token = admin_user
        uid = str(user_doc["_id"])
        resp = await client.delete(f"/api/users/{uid}", headers=auth_header(token))
        assert resp.status_code == 400
        assert "cannot delete" in resp.json()["detail"].lower()

    @pytest.mark.asyncio
    async def test_delete_user_success(self, client, admin_user):
        """Create a disposable user with no references and delete it."""
        _, token = admin_user
        create_resp = await client.post("/api/users/", json={
            "name": "Disposable",
            "type": "Factory",
            "contact_no": "0300000090",
            "email": "disposable@test.com",
            "password": "dispose123",
        }, headers=auth_header(token))
        uid = create_resp.json()["_id"]
        resp = await client.delete(f"/api/users/{uid}", headers=auth_header(token))
        assert resp.status_code == 200

    # ---- ACTIVATE / DEACTIVATE ----
    @pytest.mark.asyncio
    async def test_deactivate_and_activate_user(self, client, admin_user):
        _, token = admin_user
        # create user
        create_resp = await client.post("/api/users/", json={
            "name": "Toggle",
            "type": "Rep",
            "contact_no": "0300000080",
            "email": "toggle@test.com",
            "password": "toggle123",
        }, headers=auth_header(token))
        uid = create_resp.json()["_id"]

        # deactivate
        resp = await client.put(f"/api/users/{uid}/deactivate", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["is_active"] is False

        # activate
        resp = await client.put(f"/api/users/{uid}/activate", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["is_active"] is True

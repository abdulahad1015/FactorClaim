"""Integration tests for authentication endpoints."""
import pytest
from tests.conftest import auth_header


class TestAuth:
    """Test /api/auth endpoints."""

    @pytest.mark.asyncio
    async def test_login_success(self, client, admin_user):
        user_doc, _ = admin_user
        resp = await client.post("/api/auth/login", json={
            "email": user_doc["email"],
            "password": "testadmin123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["message"] == "Login successful"
        assert "token" in data
        assert data["user"]["email"] == user_doc["email"]

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client, admin_user):
        user_doc, _ = admin_user
        resp = await client.post("/api/auth/login", json={
            "email": user_doc["email"],
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_login_nonexistent_email(self, client):
        resp = await client.post("/api/auth/login", json={
            "email": "nobody@test.com",
            "password": "whatever",
        })
        assert resp.status_code == 401

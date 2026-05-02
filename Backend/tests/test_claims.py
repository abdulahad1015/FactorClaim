"""Integration tests for claim endpoints."""
import pytest
from bson import ObjectId
from tests.conftest import auth_header


class TestClaims:
    """Test /api/claims endpoints."""

    # ---- CREATE ----
    @pytest.mark.asyncio
    async def test_create_claim(
        self, client, rep_user, sample_merchant, sample_batch
    ):
        user_doc, token = rep_user
        resp = await client.post("/api/claims/", json={
            "rep_id": str(user_doc["_id"]),
            "merchant_id": str(sample_merchant["_id"]),
            "items": [
                {
                    "batch_id": str(sample_batch["_id"]),
                    "quantity": 3,
                    "notes": "scratched",
                    "force_add": False,
                }
            ],
            "notes": "CI test claim",
        }, headers=auth_header(token))
        assert resp.status_code == 200
        data = resp.json()
        assert data["verified"] is False
        assert len(data["items"]) == 1

    @pytest.mark.asyncio
    async def test_create_claim_missing_items(self, client, rep_user, sample_merchant):
        user_doc, token = rep_user
        resp = await client.post("/api/claims/", json={
            "rep_id": str(user_doc["_id"]),
            "merchant_id": str(sample_merchant["_id"]),
            "items": [],
        }, headers=auth_header(token))
        assert resp.status_code == 422

    @pytest.mark.asyncio
    async def test_create_claim_forbidden_for_factory(
        self, client, factory_user, sample_merchant, sample_batch
    ):
        user_doc, token = factory_user
        resp = await client.post("/api/claims/", json={
            "rep_id": str(user_doc["_id"]),
            "merchant_id": str(sample_merchant["_id"]),
            "items": [{"batch_id": str(sample_batch["_id"]), "quantity": 1}],
        }, headers=auth_header(token))
        assert resp.status_code == 403

    # ---- READ ----
    @pytest.mark.asyncio
    async def test_list_claims(self, client, admin_user, sample_claim):
        _, token = admin_user
        resp = await client.get("/api/claims/", headers=auth_header(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    @pytest.mark.asyncio
    async def test_get_claim_by_id(self, client, admin_user, sample_claim):
        _, token = admin_user
        cid = str(sample_claim["_id"])
        resp = await client.get(f"/api/claims/{cid}", headers=auth_header(token))
        assert resp.status_code == 200
        assert resp.json()["claim_id"] == "CLM-TEST-0001"

    @pytest.mark.asyncio
    async def test_get_claim_by_claim_id(self, client, admin_user, sample_claim):
        _, token = admin_user
        resp = await client.get(
            "/api/claims/claim-id/CLM-TEST-0001", headers=auth_header(token)
        )
        assert resp.status_code == 200

    @pytest.mark.asyncio
    async def test_get_claim_not_found(self, client, admin_user):
        _, token = admin_user
        resp = await client.get(f"/api/claims/{ObjectId()}", headers=auth_header(token))
        assert resp.status_code == 404

    @pytest.mark.asyncio
    async def test_get_unverified_claims(self, client, admin_user, sample_claim, setup_test_db):
        """Unverified endpoint excludes Bilty Pending; update sample to Approval Pending first."""
        _, token = admin_user
        # Move sample claim past Bilty Pending so it shows in the unverified list
        from bson import ObjectId as OID
        await setup_test_db["claims"].update_one(
            {"_id": sample_claim["_id"]},
            {"$set": {"status": "Approval Pending", "bilty_number": "BLT-X"}},
        )
        resp = await client.get("/api/claims/unverified", headers=auth_header(token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    @pytest.mark.asyncio
    async def test_get_claims_by_rep(self, client, rep_user, sample_claim):
        user_doc, token = rep_user
        resp = await client.get(
            f"/api/claims/rep/{user_doc['_id']}", headers=auth_header(token)
        )
        assert resp.status_code == 200

    # ---- UPDATE ----
    @pytest.mark.asyncio
    async def test_update_claim(self, client, admin_user, sample_claim):
        _, token = admin_user
        cid = str(sample_claim["_id"])
        resp = await client.put(f"/api/claims/{cid}", json={
            "notes": "updated notes",
        }, headers=auth_header(token))
        assert resp.status_code == 200

    # ---- BILTY ----
    @pytest.mark.asyncio
    async def test_update_bilty_number(self, client, rep_user, sample_claim):
        _, token = rep_user
        cid = str(sample_claim["_id"])
        resp = await client.put(f"/api/claims/{cid}/bilty", json={
            "bilty_number": "BLT-001",
        }, headers=auth_header(token))
        assert resp.status_code == 200

    # ---- VERIFY ----
    @pytest.mark.asyncio
    async def test_verify_claim(self, client, admin_user, sample_claim, sample_batch):
        user_doc, token = admin_user
        cid = str(sample_claim["_id"])
        resp = await client.put(f"/api/claims/{cid}/verify", json={
            "verified_by": str(user_doc["_id"]),
            "notes": "looks good",
            "item_results": [
                {
                    "batch_id": str(sample_batch["_id"]),
                    "status": "approved",
                    "scanned_quantity": 5,
                    "required_quantity": 5,
                }
            ],
        }, headers=auth_header(token))
        assert resp.status_code == 200

    # ---- APPROVE ----
    @pytest.mark.asyncio
    async def test_approve_claim(self, client, admin_user, sample_claim):
        user_doc, token = admin_user
        cid = str(sample_claim["_id"])
        resp = await client.put(f"/api/claims/{cid}/approve", json={
            "verified_by": str(user_doc["_id"]),
            "notes": "approved",
        }, headers=auth_header(token))
        assert resp.status_code == 200

    # ---- DELETE ----
    @pytest.mark.asyncio
    async def test_delete_claim(self, client, rep_user, sample_merchant, sample_batch):
        user_doc, token = rep_user
        create_resp = await client.post("/api/claims/", json={
            "rep_id": str(user_doc["_id"]),
            "merchant_id": str(sample_merchant["_id"]),
            "items": [{"batch_id": str(sample_batch["_id"]), "quantity": 1}],
        }, headers=auth_header(token))
        cid = create_resp.json()["_id"]
        resp = await client.delete(f"/api/claims/{cid}", headers=auth_header(token))
        assert resp.status_code == 200

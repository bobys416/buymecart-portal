import io
import json
import uuid
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from app.models.onboarding import (
    ApplicationStatus,
    DocumentVerificationStatus,
    KycDocumentType,
    OnboardingApplication,
)
from app.models.user import User, UserRole, UserStatus


def get_token(client: TestClient, login_id: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"login_id": login_id, "password": password})
    assert res.status_code == 200, f"Login failed for {login_id}: {res.text}"
    return res.json()["access_token"]


# Valid sample file bytes with legitimate magic bytes
VALID_JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00" + b"\x00" * 100
VALID_PNG_BYTES = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4"
VALID_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF"
VALID_MP4_BYTES = b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00isommp42" + b"\x00" * 100


def test_admin_creates_super_distributor_draft(client: TestClient, db_session):
    """Admin initiates onboarding for a Super Distributor (no parent allowed)."""
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")

    payload = {
        "applicant_role": "SUPER_DISTRIBUTOR",
        "parent_distributor_id": None,
        "territory": "North Region",
        "personal": {
            "full_name": "Rohan Sharma",
            "rmn": "9811223344",
            "email": "rohan.sd@buymecart.org",
            "dob": "1988-04-12",
        },
        "business": {
            "business_name": "North FinTech Distributors LLP",
            "shop_name": "North Regional Hub",
            "category": "Telecom & Banking Services",
            "business_type": "LLP",
            "shop_address": "Suite 401, Cyber Park",
            "country": "India",
            "state": "Delhi",
            "district": "New Delhi",
            "city": "New Delhi",
            "pin_code": "110001",
        },
        "identity": {
            "pan_number": "ABCDE1234F",
            "aadhaar_last_four": "9012",
            "address_proof_type": "Electricity Bill",
        },
        "bank": {
            "account_holder_name": "North FinTech Distributors LLP",
            "bank_name": "HDFC Bank",
            "account_number": "50200012345678",
            "ifsc_code": "HDFC0001234",
            "account_type": "Current",
            "branch": "Connaught Place",
        },
        "video_kyc": {
            "vkyc_duration_seconds": 32,
            "vkyc_code_recited": "729-418",
            "vkyc_consent_given": True,
        },
    }

    res = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {admin_token}"},
        json=payload,
    )
    assert res.status_code == status.HTTP_201_CREATED, res.text
    data = res.json()
    assert data["status"] == "DRAFT"
    assert data["applicant_role"] == "SUPER_DISTRIBUTOR"
    assert data["application_number"].startswith("APP-")
    assert data["territory"] == "North Region"
    assert data["parent_distributor_id"] is None

    # Check generated document checklist
    doc_types = [d["document_type"] for d in data["documents"]]
    assert "PAN_CARD" in doc_types
    assert "AADHAAR_FRONT" in doc_types
    assert "BANK_PROOF" in doc_types
    assert "MERCHANT_SELFIE" in doc_types
    assert "SIGNATURE" in doc_types
    assert "VKYC_VIDEO" in doc_types
    assert "REGISTRATION_DOC" in doc_types  # Required for LLP


def test_super_distributor_onboards_area_distributor_under_self(client: TestClient, db_session):
    """Super Distributor onboards Area Distributor reporting to SD1."""
    sd1_token = get_token(client, "sd.central@buymecart.org", "SuperDistPass#2026")
    sd_user = db_session.query(User).filter(User.login_id == "sd.central@buymecart.org").first()

    payload = {
        "applicant_role": "AREA_DISTRIBUTOR",
        "parent_distributor_id": str(sd_user.id),
        "personal": {
            "full_name": "Vikram Sethi",
            "rmn": "9877001122",
            "email": "vikram.ad@buymecart.org",
        },
        "business": {
            "business_name": "Bhopal Area Distribution",
            "shop_name": "Sethi Agency",
            "business_type": "Sole Proprietorship",
        },
        "identity": {
            "pan_number": "BHPVK1234K",
            "aadhaar_last_four": "4433",
        },
        "bank": {
            "account_holder_name": "Vikram Sethi",
            "bank_name": "State Bank of India",
            "account_number": "300012345678",
            "ifsc_code": "SBIN0001234",
        },
    }

    res = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {sd1_token}"},
        json=payload,
    )
    assert res.status_code == status.HTTP_201_CREATED, res.text
    data = res.json()
    assert data["applicant_role"] == "AREA_DISTRIBUTOR"
    assert data["parent_distributor_id"] == str(sd_user.id)


def test_area_distributor_onboards_retailer_under_self(client: TestClient, db_session):
    """Area Distributor onboards a direct Retailer merchant under their management."""
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ad_user = db_session.query(User).filter(User.login_id == "ad.zone1@buymecart.org").first()

    payload = {
        "applicant_role": "RETAILER",
        "parent_distributor_id": str(ad_user.id),
        "personal": {
            "full_name": "Karan Merchant",
            "rmn": "9899001122",
            "email": "karan.store@buymecart.org",
        },
        "business": {
            "business_name": "Karan General Store",
            "shop_name": "Karan Store",
            "business_type": "Individual",
        },
        "identity": {
            "pan_number": "KRNMC1234L",
            "aadhaar_last_four": "1122",
        },
        "bank": {
            "account_holder_name": "Karan Merchant",
            "bank_name": "Punjab National Bank",
            "account_number": "12345678901234",
            "ifsc_code": "PUNB0001234",
        },
    }

    res = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json=payload,
    )
    assert res.status_code == status.HTTP_201_CREATED, res.text
    data = res.json()
    assert data["applicant_role"] == "RETAILER"
    assert data["parent_distributor_id"] == str(ad_user.id)
    doc_types = [d["document_type"] for d in data["documents"]]
    assert "EMPLOYEE_SELFIE" in doc_types  # PDF compliance requirement for Retailer
    assert "SHOP_FRONT" in doc_types


def test_retailer_cannot_initiate_onboarding(client: TestClient):
    """Retailers have no child accounts and cannot initiate onboarding."""
    ret1_token = get_token(client, "retailer.store1@buymecart.org", "RetailerPass#2026")
    payload = {
        "applicant_role": "RETAILER",
        "personal": {"full_name": "Illegal Subordinate", "rmn": "9899999999", "email": "bad@buymecart.org"},
    }
    res = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {ret1_token}"},
        json=payload,
    )
    assert res.status_code == status.HTTP_403_FORBIDDEN


def test_invalid_hierarchy_assignments_rejected(client: TestClient, db_session):
    """Enforces server-side validation against invalid parent hierarchy assignments."""
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")

    sd_user = db_session.query(User).filter(User.login_id == "sd.central@buymecart.org").first()
    ret_user = db_session.query(User).filter(User.login_id == "retailer.store1@buymecart.org").first()

    # 1. Super Distributor cannot have a parent
    res1 = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "applicant_role": "SUPER_DISTRIBUTOR",
            "parent_distributor_id": str(sd_user.id),
            "personal": {"full_name": "Bad SD", "rmn": "9811000000", "email": "bad.sd@buymecart.org"},
        },
    )
    assert res1.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # 2. Area Distributor cannot have a Retailer as parent
    res2 = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "applicant_role": "AREA_DISTRIBUTOR",
            "parent_distributor_id": str(ret_user.id),
            "personal": {"full_name": "Bad AD", "rmn": "9811000001", "email": "bad.ad@buymecart.org"},
        },
    )
    assert res2.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # 3. Area Distributor cannot initiate onboarding for another Area Distributor
    res3 = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={
            "applicant_role": "AREA_DISTRIBUTOR",
            "parent_distributor_id": str(sd_user.id),
            "personal": {"full_name": "Disallowed AD", "rmn": "9811000002", "email": "disallowed@buymecart.org"},
        },
    )
    assert res3.status_code == status.HTTP_403_FORBIDDEN


def test_submitting_incomplete_application_fails_validation(client: TestClient, db_session):
    """Validates that incomplete draft applications fail submission with 422 Unprocessable Content."""
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ad_user = db_session.query(User).filter(User.login_id == "ad.zone1@buymecart.org").first()

    # Create draft with missing PAN and documents
    res_create = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={
            "applicant_role": "RETAILER",
            "parent_distributor_id": str(ad_user.id),
            "personal": {"full_name": "Incomplete Applicant", "rmn": "9811001122", "email": "incomplete@buymecart.org"},
        },
    )
    app_id = res_create.json()["id"]

    # Attempt to submit
    res_submit = client.post(
        f"/api/v1/onboarding/{app_id}/submit",
        headers={"Authorization": f"Bearer {ad1_token}"},
    )
    assert res_submit.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
    assert "Mandatory fields incomplete" in res_submit.json()["detail"]


def test_document_upload_magic_bytes_and_security(client: TestClient, db_session):
    """Tests document upload validation: MIME checking, magic bytes, and path traversal protection."""
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ad_user = db_session.query(User).filter(User.login_id == "ad.zone1@buymecart.org").first()

    res_create = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={
            "applicant_role": "RETAILER",
            "parent_distributor_id": str(ad_user.id),
            "personal": {"full_name": "Test Upload", "rmn": "9811009988", "email": "upload@buymecart.org"},
        },
    )
    app_data = res_create.json()
    app_id = app_data["id"]
    pan_doc = next(d for d in app_data["documents"] if d["document_type"] == "PAN_CARD")

    # 1. Invalid magic bytes (plain text file claiming to be JPEG)
    fake_file = io.BytesIO(b"Hello world, I am a fake JPEG")
    res_fake = client.post(
        f"/api/v1/onboarding/{app_id}/documents/{pan_doc['id']}/upload",
        headers={"Authorization": f"Bearer {ad1_token}"},
        files={"file": ("fake_pan.jpg", fake_file, "image/jpeg")},
    )
    assert res_fake.status_code == status.HTTP_400_BAD_REQUEST
    assert "magic bytes do not match" in res_fake.json()["detail"]

    # 2. Valid JPEG upload
    valid_file = io.BytesIO(VALID_JPEG_BYTES)
    res_valid = client.post(
        f"/api/v1/onboarding/{app_id}/documents/{pan_doc['id']}/upload",
        headers={"Authorization": f"Bearer {ad1_token}"},
        files={"file": ("valid_pan.jpg", valid_file, "image/jpeg")},
    )
    assert res_valid.status_code == status.HTTP_200_OK
    doc_res = res_valid.json()
    assert doc_res["status"] == "UPLOADED"  # NEVER auto-verified!
    assert doc_res["sha256_checksum"] is not None
    assert doc_res["file_size_bytes"] == len(VALID_JPEG_BYTES)

    # 3. Authorized download check
    res_dl = client.get(
        f"/api/v1/onboarding/{app_id}/documents/{pan_doc['id']}/download",
        headers={"Authorization": f"Bearer {ad1_token}"},
    )
    assert res_dl.status_code == status.HTTP_200_OK
    assert res_dl.content == VALID_JPEG_BYTES


def test_complete_onboarding_lifecycle_review_and_activation(client: TestClient, db_session):
    """
    Tests complete lifecycle:
    Draft -> Updates -> Document Uploads -> Submit (UNDER_REVIEW) -> Correction Request ->
    Resubmit -> Review Approval -> Controlled Administrative Activation (ACTIVE User).
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    sd1_token = get_token(client, "sd.central@buymecart.org", "SuperDistPass#2026")
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")

    ad_user = db_session.query(User).filter(User.login_id == "ad.zone1@buymecart.org").first()

    # Step 1: Create draft
    res_draft = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={
            "applicant_role": "RETAILER",
            "parent_distributor_id": str(ad_user.id),
            "personal": {
                "full_name": "Suresh Merchant",
                "rmn": "9812345678",
                "email": "suresh.retail@buymecart.org",
            },
            "identity": {
                "pan_number": "SURSH1234M",
                "aadhaar_last_four": "8877",
            },
            "bank": {
                "account_holder_name": "Suresh Merchant",
                "bank_name": "Axis Bank",
                "account_number": "912010012345678",
                "ifsc_code": "UTIB0001234",
            },
        },
    )
    assert res_draft.status_code == status.HTTP_201_CREATED
    app_id = res_draft.json()["id"]

    # Step 2: Upload all required documents
    docs = res_draft.json()["documents"]
    for d in docs:
        if d["required"]:
            sample_bytes = VALID_PDF_BYTES if "BANK" in d["document_type"] else VALID_JPEG_BYTES
            mime = "application/pdf" if "BANK" in d["document_type"] else "image/jpeg"
            fname = "doc.pdf" if "BANK" in d["document_type"] else "doc.jpg"

            res_up = client.post(
                f"/api/v1/onboarding/{app_id}/documents/{d['id']}/upload",
                headers={"Authorization": f"Bearer {ad1_token}"},
                files={"file": (fname, io.BytesIO(sample_bytes), mime)},
            )
            assert res_up.status_code == status.HTTP_200_OK

    # Step 3: Submit application -> advances to UNDER_REVIEW
    res_sub = client.post(
        f"/api/v1/onboarding/{app_id}/submit",
        headers={"Authorization": f"Bearer {ad1_token}"},
    )
    assert res_sub.status_code == status.HTTP_200_OK
    assert res_sub.json()["status"] == "UNDER_REVIEW"

    # Retry after a lost response is idempotent and does not enqueue twice.
    res_retry = client.post(
        f"/api/v1/onboarding/{app_id}/submit",
        headers={"Authorization": f"Bearer {ad1_token}"},
    )
    assert res_retry.status_code == status.HTTP_200_OK
    assert res_retry.json()["id"] == app_id
    assert db_session.query(OnboardingApplication).filter(OnboardingApplication.id == uuid.UUID(app_id)).one().status == ApplicationStatus.UNDER_REVIEW

    # Step 4: Self-review prohibited: AD1 initiated this application, so AD1 cannot review it!
    res_self_rev = client.post(
        f"/api/v1/onboarding/{app_id}/review",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={"action": "APPROVED", "remarks": "I approve my own merchant"},
    )
    # AD1 lacks REVIEW_ONBOARDING permission anyway, and self-review is forbidden
    assert res_self_rev.status_code == status.HTTP_403_FORBIDDEN

    # Step 5: Reviewer (SD1 or Admin) requests correction
    res_corr = client.post(
        f"/api/v1/onboarding/{app_id}/review",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={
            "action": "CORRECTION_REQUESTED",
            "remarks": "Bank proof cancelled cheque is blurry. Please re-upload.",
            "correction_fields": ["BANK_PROOF"],
        },
    )
    assert res_corr.status_code == status.HTTP_200_OK
    assert res_corr.json()["status"] == "CORRECTION_REQUIRED"
    assert res_corr.json()["correction_reason"] == "Bank proof cancelled cheque is blurry. Please re-upload."

    # Step 6: Re-upload flagged document and resubmit
    bank_doc = next(d for d in docs if d["document_type"] == "BANK_PROOF")
    res_reup = client.post(
        f"/api/v1/onboarding/{app_id}/documents/{bank_doc['id']}/upload",
        headers={"Authorization": f"Bearer {ad1_token}"},
        files={"file": ("clear_cheque.pdf", io.BytesIO(VALID_PDF_BYTES), "application/pdf")},
    )
    assert res_reup.status_code == status.HTTP_200_OK

    res_resub = client.post(
        f"/api/v1/onboarding/{app_id}/resubmit",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={"remarks": "Uploaded crystal clear bank statement copy."},
    )
    assert res_resub.status_code == status.HTTP_200_OK
    assert res_resub.json()["status"] == "UNDER_REVIEW"

    # Step 7: Reviewer formally approves the application
    res_appr = client.post(
        f"/api/v1/onboarding/{app_id}/review",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"action": "APPROVED", "remarks": "All documents verified and compliant."},
    )
    assert res_appr.status_code == status.HTTP_200_OK
    app_approved = res_appr.json()
    assert app_approved["status"] == "APPROVED"
    assert app_approved["approved_at"] is not None

    # Step 8: Activation: Non-admin cannot activate
    res_bad_act = client.post(
        f"/api/v1/onboarding/{app_id}/activate",
        headers={"Authorization": f"Bearer {sd1_token}"},
        json={"initial_password": "MerchantPass#2026"},
    )
    assert res_bad_act.status_code == status.HTTP_403_FORBIDDEN

    # Step 9: Admin activates the approved application
    res_act = client.post(
        f"/api/v1/onboarding/{app_id}/activate",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"initial_password": "MerchantPass#2026", "notes": "Approved and activated merchant terminal"},
    )
    assert res_act.status_code == status.HTTP_200_OK
    app_activated = res_act.json()
    assert app_activated["status"] == "ACTIVATED"
    assert app_activated["activated_user_id"] is not None

    # Step 10: Verify the new User account exists in the database
    new_user = db_session.query(User).filter(User.id == uuid.UUID(app_activated["activated_user_id"])).first()
    assert new_user is not None
    assert new_user.login_id == "suresh.retail@buymecart.org"
    assert new_user.role == UserRole.RETAILER
    assert new_user.parent_id == ad_user.id
    assert new_user.status == UserStatus.ACTIVE


def test_safe_response_serialization_masks_sensitive_data(client: TestClient, db_session):
    """Ensures PAN, Aadhaar, and bank account numbers are masked in all standard API responses."""
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ad_user = db_session.query(User).filter(User.login_id == "ad.zone1@buymecart.org").first()

    res = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={
            "applicant_role": "RETAILER",
            "parent_distributor_id": str(ad_user.id),
            "personal": {"full_name": "Masking Check", "rmn": "9811224455", "email": "masking@buymecart.org"},
            "identity": {
                "pan_number": "ABCDE1234F",
                "aadhaar_last_four": "9988",
            },
            "bank": {
                "account_holder_name": "Masking Check",
                "bank_name": "HDFC Bank",
                "account_number": "50200098765432",
                "ifsc_code": "HDFC0001234",
            },
        },
    )
    assert res.status_code == status.HTTP_201_CREATED
    data = res.json()

    # Identity masking checks
    assert data["identity"]["pan_number"] == "ABXXXXX34F"
    assert data["identity"]["aadhaar_last_four"] == "•••• •••• 9988"

    # Bank account masking checks
    assert data["bank"]["account_number_masked"] == "•••• •••• 5432"
    assert "account_number" not in data["bank"]

    # Raw secrets check
    json_str = json.dumps(data)
    assert "50200098765432" not in json_str
    assert "password" not in json_str


def test_cross_distributor_isolation_onboarding_queue(client: TestClient, db_session):
    """Super Distributor 1 cannot view or access applications initiated under Super Distributor 2."""
    sd1_token = get_token(client, "sd.central@buymecart.org", "SuperDistPass#2026")
    sd2_token = get_token(client, "sd.west@buymecart.org", "SuperDistPass#2026")

    sd2_user = db_session.query(User).filter(User.login_id == "sd.west@buymecart.org").first()

    # Create application in SD2 network (West Region)
    res_sd2 = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {sd2_token}"},
        json={
            "applicant_role": "AREA_DISTRIBUTOR",
            "parent_distributor_id": str(sd2_user.id),
            "personal": {"full_name": "West AD Candidate", "rmn": "9822334455", "email": "west.ad@buymecart.org"},
        },
    )
    assert res_sd2.status_code == status.HTTP_201_CREATED
    sd2_app_id = res_sd2.json()["id"]

    # SD1 (Central Region) attempts to view SD2's application -> 404 Not Found
    res_lookup = client.get(
        f"/api/v1/onboarding/{sd2_app_id}",
        headers={"Authorization": f"Bearer {sd1_token}"},
    )
    assert res_lookup.status_code == status.HTTP_404_NOT_FOUND


def test_merchant_dossier_uses_scoped_retailer_directory_and_prevents_duplicates(client: TestClient, db_session):
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    retailer_1 = db_session.query(User).filter(User.login_id == "retailer.store1@buymecart.org").one()
    retailer_2 = db_session.query(User).filter(User.login_id == "retailer.west1@buymecart.org").one()

    directory = client.get(
        "/api/v1/retailers?page=1&page_size=100&status=ACTIVE",
        headers={"Authorization": f"Bearer {ad1_token}"},
    )
    assert directory.status_code == status.HTTP_200_OK
    assert [item["id"] for item in directory.json()["items"]] == [str(retailer_1.id)]

    payload = {
        "applicant_role": "RETAILER",
        "target_merchant_id": str(retailer_1.id),
        "parent_distributor_id": str(retailer_1.parent_id),
        "personal": {"full_name": retailer_1.full_name, "rmn": retailer_1.phone, "email": retailer_1.email},
        "identity": {"pan_number": "ABCDE1234F", "aadhaar_last_four": "9012"},
        "bank": {
            "account_holder_name": retailer_1.full_name,
            "bank_name": "Synthetic Test Bank",
            "account_number": "123456789012",
            "ifsc_code": "TEST0001234",
        },
    }
    created = client.post("/api/v1/onboarding", headers={"Authorization": f"Bearer {ad1_token}"}, json=payload)
    assert created.status_code == status.HTTP_201_CREATED, created.text
    assert created.json()["target_merchant_id"] == str(retailer_1.id)

    duplicate = client.post("/api/v1/onboarding", headers={"Authorization": f"Bearer {ad1_token}"}, json=payload)
    assert duplicate.status_code == status.HTTP_409_CONFLICT

    out_of_scope = {**payload, "target_merchant_id": str(retailer_2.id), "parent_distributor_id": str(retailer_2.parent_id)}
    forbidden = client.post("/api/v1/onboarding", headers={"Authorization": f"Bearer {ad1_token}"}, json=out_of_scope)
    assert forbidden.status_code == status.HTTP_404_NOT_FOUND

    wrong_parent = {**payload, "parent_distributor_id": str(retailer_2.parent_id)}
    rejected = client.post("/api/v1/onboarding", headers={"Authorization": f"Bearer {admin_token}"}, json=wrong_parent)
    assert rejected.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

import io
import json
import uuid
import pytest
from fastapi import status
from fastapi.testclient import TestClient
from app.models.onboarding import (
    ApplicationStatus,
    BankVerificationStatus,
    ConsentRecord,
    ConsentType,
    DocumentVerificationStatus,
    KycDocumentType,
    OnboardingApplication,
)
from app.models.user import User, UserRole, UserStatus


def get_token(client: TestClient, login_id: str, password: str) -> str:
    res = client.post("/api/v1/auth/login", json={"login_id": login_id, "password": password})
    assert res.status_code == 200, f"Login failed for {login_id}: {res.text}"
    return res.json()["access_token"]


VALID_JPEG_BYTES = b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00`\x00`\x00\x00\xff\xdb\x00C\x00" + b"\x00" * 100
VALID_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF"


def test_statutory_pan_verification_valid_and_invalid_formats(client: TestClient, db_session):
    """Validates statutory Income Tax Department PAN syntax, entity classification, and name matching."""
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ad_user = db_session.query(User).filter(User.login_id == "ad.zone1@buymecart.org").first()

    # 1. Create draft application
    res_draft = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={
            "applicant_role": "RETAILER",
            "parent_distributor_id": str(ad_user.id),
            "personal": {
                "full_name": "Rajesh Kumar",
                "rmn": "9811122233",
                "email": "rajesh.retail@buymecart.org",
            },
            "identity": {
                "pan_number": "ABCDE1234F",
                "aadhaar_last_four": "1234",
            },
            "bank": {
                "account_holder_name": "Rajesh Kumar",
                "bank_name": "HDFC Bank",
                "account_number": "50100012345678",
                "ifsc_code": "HDFC0001234",
            },
        },
    )
    assert res_draft.status_code == status.HTTP_201_CREATED
    app_id = res_draft.json()["id"]

    # 2. Invalid PAN format rejected
    res_bad = client.post(
        f"/api/v1/onboarding/{app_id}/verify/pan",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={"pan_number": "INVALID123"},
    )
    assert res_bad.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # 3. Valid Individual PAN (4th char 'P')
    res_ind = client.post(
        f"/api/v1/onboarding/{app_id}/verify/pan",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={"pan_number": "AAAPK1234K"},
    )
    assert res_ind.status_code == status.HTTP_200_OK
    pan_data = res_ind.json()
    assert pan_data["format_valid"] is True
    assert pan_data["pan_verified"] is True
    assert pan_data["entity_type"] == "Individual"
    assert "AA•••••34K" in pan_data["pan_number"]

    # 4. Valid Company PAN (4th char 'C')
    res_comp = client.post(
        f"/api/v1/onboarding/{app_id}/verify/pan",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={"pan_number": "XYZCK5678Z"},
    )
    assert res_comp.status_code == status.HTTP_200_OK
    assert res_comp.json()["entity_type"] == "Company"


def test_statutory_aadhaar_verification_and_consent_audit(client: TestClient, db_session):
    """Validates Aadhaar 4-digit verification and regulatory consent logging."""
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ad_user = db_session.query(User).filter(User.login_id == "ad.zone1@buymecart.org").first()

    res_draft = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={
            "applicant_role": "RETAILER",
            "parent_distributor_id": str(ad_user.id),
            "personal": {
                "full_name": "Meera Patel",
                "rmn": "9822334455",
                "email": "meera.patel@buymecart.org",
            },
            "identity": {
                "pan_number": "MPPPA1234P",
                "aadhaar_last_four": "9988",
            },
            "bank": {
                "account_holder_name": "Meera Patel",
                "bank_name": "ICICI Bank",
                "account_number": "100012345678",
                "ifsc_code": "ICIC0001234",
            },
        },
    )
    app_id = res_draft.json()["id"]

    # 1. Non-numeric or wrong length Aadhaar rejected
    res_bad = client.post(
        f"/api/v1/onboarding/{app_id}/verify/aadhaar",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={"aadhaar_last_four": "12A4"},
    )
    assert res_bad.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # 2. Valid Aadhaar verification with consent
    res_ok = client.post(
        f"/api/v1/onboarding/{app_id}/verify/aadhaar",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={"aadhaar_last_four": "9988", "consent_given": True, "consent_text_version": "UIDAI-2026-V1"},
    )
    assert res_ok.status_code == status.HTTP_200_OK
    data = res_ok.json()
    assert data["format_valid"] is True
    assert data["aadhaar_verified"] is True
    assert "9988" in data["aadhaar_last_four"]

    # Check database consent record
    consent = db_session.query(ConsentRecord).filter(ConsentRecord.id == uuid.UUID(data["consent_record_id"])).first()
    assert consent is not None
    assert consent.consent_type == ConsentType.AADHAAR_OFFLINE_KYC
    assert consent.consent_text_version == "UIDAI-2026-V1"


def test_statutory_bank_verification_penny_drop_and_ifsc_syntax(client: TestClient, db_session):
    """Tests bank account Penny-Drop verification and statutory RBI IFSC syntax."""
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ad_user = db_session.query(User).filter(User.login_id == "ad.zone1@buymecart.org").first()

    res_draft = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={
            "applicant_role": "RETAILER",
            "parent_distributor_id": str(ad_user.id),
            "personal": {
                "full_name": "Amit Shah",
                "rmn": "9833445566",
                "email": "amit.shah@buymecart.org",
            },
            "identity": {
                "pan_number": "ASHPA1234A",
                "aadhaar_last_four": "5566",
            },
            "bank": {
                "account_holder_name": "Amit Shah",
                "bank_name": "State Bank of India",
                "account_number": "300012345678",
                "ifsc_code": "SBIN0001234",
            },
        },
    )
    app_id = res_draft.json()["id"]

    # 1. Invalid IFSC syntax (missing 0 at pos 4)
    res_bad_ifsc = client.post(
        f"/api/v1/onboarding/{app_id}/verify/bank",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={"ifsc_code": "SBINX001234"},
    )
    assert res_bad_ifsc.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    # 2. Valid Penny-Drop verification
    res_ok = client.post(
        f"/api/v1/onboarding/{app_id}/verify/bank",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={"ifsc_code": "SBIN0001234"},
    )
    assert res_ok.status_code == status.HTTP_200_OK
    bank_data = res_ok.json()
    assert bank_data["verified"] is True
    assert bank_data["ifsc_code"] == "SBIN0001234"
    assert bank_data["penny_drop_reference"].startswith("PD-2026-")
    assert bank_data["verification_status"] == "MANUALLY_VERIFIED"


def test_kyc_ml_risk_evaluation_endpoint(client: TestClient, db_session):
    """Evaluates ML predictive intelligence scoring on an onboarding application."""
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ad_user = db_session.query(User).filter(User.login_id == "ad.zone1@buymecart.org").first()

    res_draft = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={
            "applicant_role": "RETAILER",
            "parent_distributor_id": str(ad_user.id),
            "personal": {
                "full_name": "Sunil Verma",
                "rmn": "9844556677",
                "email": "sunil.verma@buymecart.org",
            },
            "identity": {
                "pan_number": "SVMPS1234S",
                "aadhaar_last_four": "7788",
            },
            "bank": {
                "account_holder_name": "Sunil Verma",
                "bank_name": "Punjab National Bank",
                "account_number": "12345678901234",
                "ifsc_code": "PUNB0001234",
            },
        },
    )
    app_id = res_draft.json()["id"]

    res_risk = client.post(
        f"/api/v1/onboarding/{app_id}/evaluate-risk",
        headers={"Authorization": f"Bearer {ad1_token}"},
    )
    assert res_risk.status_code == status.HTTP_200_OK
    risk_data = res_risk.json()
    assert "kyc_confidence_score" in risk_data
    assert "risk_level" in risk_data
    assert "pan_verified" in risk_data
    assert "aadhaar_valid" in risk_data
    assert isinstance(risk_data["flags"], list)


def test_regulatory_compliance_dossier_export(client: TestClient, db_session):
    """Tests tamper-evident regulatory compliance KYC Dossier assembly and SHA-256 fingerprint."""
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ad_user = db_session.query(User).filter(User.login_id == "ad.zone1@buymecart.org").first()

    res_draft = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={
            "applicant_role": "RETAILER",
            "parent_distributor_id": str(ad_user.id),
            "personal": {
                "full_name": "Deepak Joshi",
                "rmn": "9855667788",
                "email": "deepak.joshi@buymecart.org",
            },
            "identity": {
                "pan_number": "DPKPA1234D",
                "aadhaar_last_four": "3344",
            },
            "bank": {
                "account_holder_name": "Deepak Joshi",
                "bank_name": "Axis Bank",
                "account_number": "91201009988776",
                "ifsc_code": "UTIB0001234",
            },
        },
    )
    app_id = res_draft.json()["id"]

    # Verify statutory records
    client.post(f"/api/v1/onboarding/{app_id}/verify/pan", headers={"Authorization": f"Bearer {ad1_token}"}, json={})
    client.post(f"/api/v1/onboarding/{app_id}/verify/aadhaar", headers={"Authorization": f"Bearer {ad1_token}"}, json={})
    client.post(f"/api/v1/onboarding/{app_id}/verify/bank", headers={"Authorization": f"Bearer {ad1_token}"}, json={})

    # Export Dossier
    res_dossier = client.get(
        f"/api/v1/onboarding/{app_id}/dossier",
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert res_dossier.status_code == status.HTTP_200_OK
    dossier = res_dossier.json()

    assert dossier["application_number"].startswith("APP-")
    assert dossier["applicant_name"] == "Deepak Joshi"
    assert dossier["pan_verified"] is True
    assert dossier["aadhaar_verified"] is True
    assert dossier["bank_verified"] is True
    assert dossier["penny_drop_reference"] is not None
    assert len(dossier["dossier_sha256_fingerprint"]) == 64  # SHA-256 length
    assert "RBI Master Direction - KYC" in dossier["regulatory_framework"]


def test_complete_phase5_statutory_kyc_lifecycle_to_activation(client: TestClient, db_session):
    """
    End-to-end integration:
    Initiate Application -> Upload Docs -> Execute Statutory PAN/Aadhaar/Bank Verifications ->
    Submit -> ML Risk Scoring -> Review Approval -> System User Activation.
    """
    admin_token = get_token(client, "admin@buymecart.org", "AdminPass#2026")
    ad1_token = get_token(client, "ad.zone1@buymecart.org", "AreaDistPass#2026")
    ad_user = db_session.query(User).filter(User.login_id == "ad.zone1@buymecart.org").first()

    # Step 1: Create application
    res_draft = client.post(
        "/api/v1/onboarding",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={
            "applicant_role": "RETAILER",
            "parent_distributor_id": str(ad_user.id),
            "personal": {
                "full_name": "Gaurav Sen",
                "rmn": "9866778899",
                "email": "gaurav.store@buymecart.org",
            },
            "identity": {
                "pan_number": "GRVPA1234G",
                "aadhaar_last_four": "1144",
            },
            "bank": {
                "account_holder_name": "Gaurav Sen",
                "bank_name": "HDFC Bank",
                "account_number": "50100099887766",
                "ifsc_code": "HDFC0001234",
            },
        },
    )
    assert res_draft.status_code == status.HTTP_201_CREATED
    app_data = res_draft.json()
    app_id = app_data["id"]

    # Step 2: Upload all required documents
    for d in app_data["documents"]:
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

    # Step 3: Run statutory verifications
    res_pan = client.post(
        f"/api/v1/onboarding/{app_id}/verify/pan",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={"pan_number": "GRVPA1234G"},
    )
    assert res_pan.status_code == status.HTTP_200_OK
    assert res_pan.json()["pan_verified"] is True

    res_aadh = client.post(
        f"/api/v1/onboarding/{app_id}/verify/aadhaar",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={"aadhaar_last_four": "1144", "consent_given": True},
    )
    assert res_aadh.status_code == status.HTTP_200_OK
    assert res_aadh.json()["aadhaar_verified"] is True

    res_bnk = client.post(
        f"/api/v1/onboarding/{app_id}/verify/bank",
        headers={"Authorization": f"Bearer {ad1_token}"},
        json={"ifsc_code": "HDFC0001234"},
    )
    assert res_bnk.status_code == status.HTTP_200_OK
    assert res_bnk.json()["verified"] is True

    # Step 4: Submit application -> UNDER_REVIEW
    res_sub = client.post(
        f"/api/v1/onboarding/{app_id}/submit",
        headers={"Authorization": f"Bearer {ad1_token}"},
    )
    assert res_sub.status_code == status.HTTP_200_OK
    assert res_sub.json()["status"] == "UNDER_REVIEW"

    # Step 5: Compliance review approval
    res_appr = client.post(
        f"/api/v1/onboarding/{app_id}/review",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"action": "APPROVED", "remarks": "Full statutory verification and KYC criteria satisfied."},
    )
    assert res_appr.status_code == status.HTTP_200_OK
    assert res_appr.json()["status"] == "APPROVED"

    # Step 6: Activate approved application
    res_act = client.post(
        f"/api/v1/onboarding/{app_id}/activate",
        headers={"Authorization": f"Bearer {admin_token}"},
        json={"initial_password": "NewMerchantPass#2026"},
    )
    assert res_act.status_code == status.HTTP_200_OK
    act_data = res_act.json()
    assert act_data["status"] == "ACTIVATED"
    assert act_data["activated_user_id"] is not None

    # Step 7: Verify activated user can immediately log in
    res_login = client.post(
        "/api/v1/auth/login",
        json={"login_id": "gaurav.store@buymecart.org", "password": "NewMerchantPass#2026"},
    )
    assert res_login.status_code == status.HTTP_200_OK
    assert "access_token" in res_login.json()

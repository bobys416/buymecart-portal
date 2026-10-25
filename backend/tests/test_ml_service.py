import pytest
from fastapi import status
from fastapi.testclient import TestClient


def get_admin_token(client: TestClient) -> str:
    res = client.post("/api/v1/auth/login", json={"login_id": "admin@buymecart.org", "password": "AdminPass#2026"})
    assert res.status_code == 200
    return res.json()["access_token"]


def test_fraud_evaluation_clean_transaction(client: TestClient):
    token = get_admin_token(client)
    res = client.post(
        "/api/v1/ml/fraud-score",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "amount": 1500.0,
            "payment_mode": "UPI",
            "velocity_last_hour": 1,
            "hour_of_day": 14,
            "is_new_beneficiary": False,
            "device_geo_distance_km": 2.5,
            "merchant_risk_tier": "STANDARD",
        },
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "risk_score" in data
    assert data["risk_tier"] in ("LOW", "MEDIUM")
    assert data["recommendation"] in ("APPROVE", "STEP_UP_2FA")
    assert data["inference_latency_ms"] < 50.0


def test_fraud_evaluation_critical_anomaly_blocked(client: TestClient):
    token = get_admin_token(client)
    res = client.post(
        "/api/v1/ml/fraud-score",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "amount": 250000.0,
            "payment_mode": "IMPS",
            "velocity_last_hour": 18,
            "hour_of_day": 3,  # off-peak fraud window
            "is_new_beneficiary": True,
            "device_geo_distance_km": 850.0,
            "merchant_risk_tier": "HIGH",
        },
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["risk_score"] >= 0.70
    assert data["risk_tier"] in ("HIGH", "CRITICAL")
    assert data["recommendation"] in ("MANUAL_REVIEW", "BLOCK")
    assert len(data["anomalies_detected"]) >= 2


def test_tempered_margin_schedule_page3_tiers(client: TestClient):
    token = get_admin_token(client)

    # Tier 1: 101 to 1000 Rs -> 7 Rs
    res1 = client.post(
        "/api/v1/ml/margin-predict",
        headers={"Authorization": f"Bearer {token}"},
        json={"amount": 500.0, "monthly_volume_inr": 50000.0},
    )
    assert res1.status_code == status.HTTP_200_OK
    assert res1.json()["recommended_margin_inr"] == 7.00
    assert "101 — 1,000 INR" in res1.json()["schedule_tier"]

    # Tier 2: 1001 to 2000 Rs -> 9 Rs
    res2 = client.post(
        "/api/v1/ml/margin-predict",
        headers={"Authorization": f"Bearer {token}"},
        json={"amount": 1500.0, "monthly_volume_inr": 50000.0},
    )
    assert res2.status_code == status.HTTP_200_OK
    assert res2.json()["recommended_margin_inr"] == 9.00
    assert "1,001 — 2,000 INR" in res2.json()["schedule_tier"]

    # Tier 3: 2001 to 200,000 Rs -> Percentage tier
    res3 = client.post(
        "/api/v1/ml/margin-predict",
        headers={"Authorization": f"Bearer {token}"},
        json={"amount": 50000.0, "monthly_volume_inr": 5000000.0},
    )
    assert res3.status_code == status.HTTP_200_OK
    # 0.20% of 50,000 = 100.00
    assert res3.json()["margin_percentage"] == 0.20
    assert res3.json()["recommended_margin_inr"] == 100.00


def test_smart_gateway_routing_optimization(client: TestClient):
    token = get_admin_token(client)
    res = client.post(
        "/api/v1/ml/smart-route",
        headers={"Authorization": f"Bearer {token}"},
        json={"amount": 10000.0, "payment_mode": "IMPS", "priority": "SUCCESS_RATE"},
    )
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert "optimal_route" in data
    assert "fallback_route" in data
    assert data["optimal_route"]["recommended"] is True
    assert data["optimal_route"]["success_probability"] >= 0.98


def test_kyc_risk_scoring(client: TestClient):
    token = get_admin_token(client)

    # Compliant 12-point submission
    res_clean = client.post(
        "/api/v1/ml/kyc-risk",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "pan_number": "ABCDE1234F",
            "aadhaar_last_four": "9921",
            "msme_udyam_number": "UDYAM-MH-01-0012345",
            "vkyc_duration_seconds": 32,
            "has_shop_photo": True,
            "has_merchant_selfie": True,
            "has_employee_selfie": True,
            "has_bank_proof": True,
        },
    )
    assert res_clean.status_code == status.HTTP_200_OK
    assert res_clean.json()["kyc_confidence_score"] == 100.0
    assert res_clean.json()["risk_level"] == "LOW_RISK"
    assert res_clean.json()["pan_verified"] is True

    # Defective submission (bad PAN and short vKYC)
    res_defect = client.post(
        "/api/v1/ml/kyc-risk",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "pan_number": "INVALID_PAN",
            "aadhaar_last_four": "12",
            "vkyc_duration_seconds": 12,
            "has_shop_photo": False,
            "has_merchant_selfie": False,
            "has_employee_selfie": False,
            "has_bank_proof": False,
        },
    )
    assert res_defect.status_code == status.HTTP_200_OK
    assert res_defect.json()["risk_level"] == "HIGH_RISK"
    assert res_defect.json()["pan_verified"] is False
    assert len(res_defect.json()["flags"]) >= 3


def test_ml_telemetry_metrics(client: TestClient):
    token = get_admin_token(client)
    res = client.get("/api/v1/ml/metrics", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == status.HTTP_200_OK
    data = res.json()
    assert data["status"] == "OPERATIONAL"
    assert data["accuracy"] > 0.95
    assert data["average_latency_ms"] < 20.0

from fastapi import APIRouter, Depends, status
from app.api.deps import get_current_active_user
from app.models.user import User
from app.services.ml_service import (
    FraudEvaluationRequest,
    FraudEvaluationResponse,
    KycRiskRequest,
    KycRiskResponse,
    MachineLearningService,
    MarginPredictionRequest,
    MarginPredictionResponse,
    SmartRouteRequest,
    SmartRouteResponse,
)

router = APIRouter(prefix="/ml", tags=["Machine Learning & Predictive Intelligence"])


@router.post(
    "/fraud-score",
    response_model=FraudEvaluationResponse,
    summary="Evaluate Real-Time Transaction Fraud & Anomaly Risk",
    description="Scores transactions against burst velocity, ticket size anomalies, and geographic leap indicators.",
)
def evaluate_transaction_fraud(
    req: FraudEvaluationRequest,
    current_user: User = Depends(get_current_active_user),
):
    return MachineLearningService.evaluate_transaction_fraud(req)


@router.post(
    "/margin-predict",
    response_model=MarginPredictionResponse,
    summary="Predict Optimal Margin and Commission Distribution",
    description="Calculates tempered margin schedule (PDF Page 3) and hierarchy commission split.",
)
def predict_tempered_margin(
    req: MarginPredictionRequest,
    current_user: User = Depends(get_current_active_user),
):
    return MachineLearningService.predict_tempered_margin(req)


@router.post(
    "/smart-route",
    response_model=SmartRouteResponse,
    summary="Compute Optimal Banking Rail Routing",
    description="Multi-armed bandit route ranking across BSpark, ICICI, Axis, and Razorpay switches.",
)
def optimize_smart_route(
    req: SmartRouteRequest,
    current_user: User = Depends(get_current_active_user),
):
    return MachineLearningService.optimize_smart_route(req)


@router.post(
    "/kyc-risk",
    response_model=KycRiskResponse,
    summary="Evaluate Merchant KYC & Onboarding Anomaly Risk",
    description="Evaluates 12-point document validity, 30s Video KYC duration, and shop evidence (PDF Pages 2 & 3).",
)
def evaluate_kyc_risk(
    req: KycRiskRequest,
    current_user: User = Depends(get_current_active_user),
):
    return MachineLearningService.evaluate_kyc_risk(req)


@router.get(
    "/metrics",
    summary="Machine Learning Model Telemetry",
    description="Returns live inference latency, ROC/AUC, accuracy, and evaluation counts.",
)
def get_ml_metrics(
    current_user: User = Depends(get_current_active_user),
):
    return MachineLearningService.get_telemetry_metrics()

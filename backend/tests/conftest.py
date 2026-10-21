import os
import sys
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Ensure backend root is in python search path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.api.deps import _IP_REQUEST_LOGS
from app.core.config import settings
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.audit_log import AuditLog
from app.models.ledger import (
    FinancialAccount,
    FundsReservation,
    IncomingWebhookEvent,
    JournalEntry,
    LedgerPosting,
    NotificationOutbox,
    ProviderReconciliationRecord,
    Transaction,
)
from app.models.onboarding import (
    ApplicationProfile,
    ApplicationReview,
    ApplicationStatusHistory,
    BankAccountVerification,
    ConsentRecord,
    KycDocument,
    OnboardingApplication,
)
from app.models.user import User, UserRole, UserStatus

# Isolated in-memory SQLite engine using StaticPool for thread-safe test isolation
test_engine = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    """Creates all database tables once for the test session."""
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture
def db_session():
    """Provides a fresh transactional database session for each test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(autouse=True)
def seed_test_users(db_session):
    """
    Seeds a consistent set of users across all four roles, dual distributor networks,
    and lifecycle statuses. Cleans up any modified user data between test runs.
    """
    # Delete existing data to prevent duplicate constraint issues
    _IP_REQUEST_LOGS.clear()
    db_session.query(IncomingWebhookEvent).delete()
    db_session.query(ProviderReconciliationRecord).delete()
    db_session.query(NotificationOutbox).delete()
    db_session.query(FundsReservation).delete()
    db_session.query(LedgerPosting).delete()
    db_session.query(JournalEntry).delete()
    db_session.query(Transaction).delete()
    db_session.query(FinancialAccount).delete()
    db_session.query(ConsentRecord).delete()
    db_session.query(ApplicationStatusHistory).delete()
    db_session.query(ApplicationReview).delete()
    db_session.query(BankAccountVerification).delete()
    db_session.query(KycDocument).delete()
    db_session.query(ApplicationProfile).delete()
    db_session.query(OnboardingApplication).delete()
    db_session.query(AuditLog).delete()
    db_session.query(User).delete()
    db_session.commit()

    # 1. Admin
    admin_id = uuid.uuid4()
    admin_user = User(
        id=admin_id,
        login_id="admin@buymecart.org",
        email="admin@buymecart.org",
        phone="9800000001",
        full_name="Root System Administrator",
        business_name="BuyMeCart Central Platform",
        territory="Global Platform",
        hashed_password=get_password_hash("AdminPass#2026"),
        role=UserRole.ADMIN,
        status=UserStatus.ACTIVE,
        parent_id=None,
    )
    db_session.add(admin_user)
    db_session.flush()

    # --- NETWORK 1 (CENTRAL REGION) ---
    # 2. Super Distributor 1
    sd1_id = uuid.uuid4()
    sd1_user = User(
        id=sd1_id,
        login_id="sd.central@buymecart.org",
        email="sd.central@buymecart.org",
        phone="9800000002",
        full_name="Central Super Distributor",
        business_name="Central Spark FinTech",
        territory="Central Region",
        hashed_password=get_password_hash("SuperDistPass#2026"),
        role=UserRole.SUPER_DISTRIBUTOR,
        status=UserStatus.ACTIVE,
        parent_id=admin_id,
    )
    db_session.add(sd1_user)
    db_session.flush()

    # 3. Area Distributor 1 (reports to SD1)
    ad1_id = uuid.uuid4()
    ad1_user = User(
        id=ad1_id,
        login_id="ad.zone1@buymecart.org",
        email="ad.zone1@buymecart.org",
        phone="9800000003",
        full_name="Zone-01 Area Distributor",
        business_name="Sunil Payments Agency",
        territory="Zone-01",
        hashed_password=get_password_hash("AreaDistPass#2026"),
        role=UserRole.AREA_DISTRIBUTOR,
        status=UserStatus.ACTIVE,
        parent_id=sd1_id,
    )
    db_session.add(ad1_user)
    db_session.flush()

    # 4. Retailer 1 (reports to AD1)
    ret1_id = uuid.uuid4()
    ret1_user = User(
        id=ret1_id,
        login_id="retailer.store1@buymecart.org",
        email="retailer.store1@buymecart.org",
        phone="9800000004",
        full_name="Storefront Retailer Sharma",
        business_name="Sharma Digital Kirana",
        territory="Zone-01",
        hashed_password=get_password_hash("RetailerPass#2026"),
        role=UserRole.RETAILER,
        status=UserStatus.ACTIVE,
        parent_id=ad1_id,
    )
    db_session.add(ret1_user)
    db_session.flush()

    # --- NETWORK 2 (WEST REGION - ISOLATED FOR CROSS-DISTRIBUTOR TESTS) ---
    # 5. Super Distributor 2
    sd2_id = uuid.uuid4()
    sd2_user = User(
        id=sd2_id,
        login_id="sd.west@buymecart.org",
        email="sd.west@buymecart.org",
        phone="9800000022",
        full_name="West Super Distributor",
        business_name="West Spark Payments",
        territory="West Region",
        hashed_password=get_password_hash("SuperDistPass#2026"),
        role=UserRole.SUPER_DISTRIBUTOR,
        status=UserStatus.ACTIVE,
        parent_id=admin_id,
    )
    db_session.add(sd2_user)
    db_session.flush()

    # 6. Area Distributor 2 (reports to SD2)
    ad2_id = uuid.uuid4()
    ad2_user = User(
        id=ad2_id,
        login_id="ad.west1@buymecart.org",
        email="ad.west1@buymecart.org",
        phone="9800000023",
        full_name="West-01 Area Distributor",
        business_name="Kavita Dist Agency",
        territory="West-01",
        hashed_password=get_password_hash("AreaDistPass#2026"),
        role=UserRole.AREA_DISTRIBUTOR,
        status=UserStatus.ACTIVE,
        parent_id=sd2_id,
    )
    db_session.add(ad2_user)
    db_session.flush()

    # 7. Retailer 2 (reports to AD2)
    ret2_id = uuid.uuid4()
    ret2_user = User(
        id=ret2_id,
        login_id="retailer.west1@buymecart.org",
        email="retailer.west1@buymecart.org",
        phone="9800000024",
        full_name="Storefront Retailer West",
        business_name="West Digital Store",
        territory="West-01",
        hashed_password=get_password_hash("RetailerPass#2026"),
        role=UserRole.RETAILER,
        status=UserStatus.ACTIVE,
        parent_id=ad2_id,
    )
    db_session.add(ret2_user)
    db_session.flush()

    # 8. Inactive User
    inactive_user = User(
        id=uuid.uuid4(),
        login_id="inactive@buymecart.org",
        email="inactive@buymecart.org",
        phone="9800000005",
        full_name="Inactive Operator",
        hashed_password=get_password_hash("InactivePass#2026"),
        role=UserRole.RETAILER,
        status=UserStatus.INACTIVE,
        parent_id=ad1_id,
    )
    db_session.add(inactive_user)

    # 9. Suspended User
    suspended_user = User(
        id=uuid.uuid4(),
        login_id="suspended@buymecart.org",
        email="suspended@buymecart.org",
        phone="9800000006",
        full_name="Suspended Operator",
        hashed_password=get_password_hash("SuspendedPass#2026"),
        role=UserRole.RETAILER,
        status=UserStatus.SUSPENDED,
        parent_id=ad1_id,
    )
    db_session.add(suspended_user)
    db_session.commit()

    return {
        "admin": admin_user,
        "sd1": sd1_user,
        "ad1": ad1_user,
        "ret1": ret1_user,
        "sd2": sd2_user,
        "ad2": ad2_user,
        "ret2": ret2_user,
        "inactive": inactive_user,
        "suspended": suspended_user,
    }


@pytest.fixture
def client(db_session):
    """FastAPI TestClient with database session override."""
    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, base_url="http://testserver") as test_client:
        yield test_client
    app.dependency_overrides.clear()

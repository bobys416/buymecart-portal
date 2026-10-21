"""
Buymecart / IBNK - Synthetic Team UAT Seed Script
Seeds a complete, isolated set of synthetic users, wallets, and system accounts
for local and staging User Acceptance Testing (UAT).

Usage:
    python backend/scripts/seed_uat_users.py
"""

import os
import sys
import uuid
from decimal import Decimal

# Ensure backend directory is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.ledger import AccountType, FinancialAccount
from app.models.user import User, UserRole, UserStatus


def seed_uat_environment():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        print("Checking existing UAT accounts...")

        # 1. System Platform Financial Accounts
        platform_accounts = [
            ("ACC-PLATFORM-CASH-001", AccountType.PLATFORM_CASH, Decimal("1000000.0000")),
            ("ACC-GATEWAY-CLEARING-001", AccountType.GATEWAY_CLEARING, Decimal("0.0000")),
            ("ACC-PLATFORM-COMMISSION-001", AccountType.PLATFORM_COMMISSION, Decimal("0.0000")),
            ("ACC-RESERVED-ESCROW-001", AccountType.FUNDS_RESERVED_ESCROW, Decimal("0.0000")),
        ]
        for acc_num, acc_type, init_bal in platform_accounts:
            existing = db.query(FinancialAccount).filter(FinancialAccount.account_number == acc_num).first()
            if not existing:
                account = FinancialAccount(
                    id=uuid.uuid4(),
                    account_number=acc_num,
                    user_id=None,
                    account_type=acc_type,
                    currency="INR",
                    current_balance=init_bal,
                    reserved_balance=Decimal("0.0000"),
                )
                db.add(account)
                print(f"Created system account: {acc_num} ({acc_type.value})")

        # 2. Admin User
        admin = db.query(User).filter(User.login_id == "admin@buymecart.org").first()
        if not admin:
            admin_id = uuid.uuid4()
            admin = User(
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
            db.add(admin)
            print("Created Admin: admin@buymecart.org")
        db.flush()

        # 3. Super Distributor (Central Region)
        sd1 = db.query(User).filter(User.login_id == "sd.central@buymecart.org").first()
        if not sd1:
            sd1_id = uuid.uuid4()
            sd1 = User(
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
                parent_id=admin.id,
            )
            db.add(sd1)
            print("Created Super Distributor: sd.central@buymecart.org")
        db.flush()

        # 4. Area Distributor (Zone 01 under SD Central)
        ad1 = db.query(User).filter(User.login_id == "ad.zone1@buymecart.org").first()
        if not ad1:
            ad1_id = uuid.uuid4()
            ad1 = User(
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
                parent_id=sd1.id,
            )
            db.add(ad1)
            print("Created Area Distributor: ad.zone1@buymecart.org")
        db.flush()

        # 5. Retailer (Store 1 under AD Zone 01)
        ret1 = db.query(User).filter(User.login_id == "retailer.store1@buymecart.org").first()
        if not ret1:
            ret1_id = uuid.uuid4()
            ret1 = User(
                id=ret1_id,
                login_id="retailer.store1@buymecart.org",
                email="retailer.store1@buymecart.org",
                phone="9800000004",
                full_name="Store 01 Retail Merchant",
                business_name="Kirana Superstore 01",
                territory="Zone-01 Retail Sector A",
                hashed_password=get_password_hash("RetailerPass#2026"),
                role=UserRole.RETAILER,
                status=UserStatus.ACTIVE,
                parent_id=ad1.id,
            )
            db.add(ret1)
            print("Created Retailer: retailer.store1@buymecart.org")
        db.flush()

        # 6. Retailer Merchant Wallet with test balance
        ret1_wallet = db.query(FinancialAccount).filter(FinancialAccount.user_id == ret1.id).first()
        if not ret1_wallet:
            ret1_wallet = FinancialAccount(
                id=uuid.uuid4(),
                account_number=f"ACC-WALLET-{ret1.login_id[:8].upper()}-001",
                user_id=ret1.id,
                account_type=AccountType.MERCHANT_WALLET,
                currency="INR",
                current_balance=Decimal("50000.0000"),
                reserved_balance=Decimal("0.0000"),
            )
            db.add(ret1_wallet)
            print(f"Created Merchant Wallet for {ret1.login_id} with INR 50,000.00 test balance")

        # 7. Secondary Network for Cross-Hierarchy Testing
        # SD South
        sd_south = db.query(User).filter(User.login_id == "sd.south@buymecart.org").first()
        if not sd_south:
            sd_south = User(
                id=uuid.uuid4(),
                login_id="sd.south@buymecart.org",
                email="sd.south@buymecart.org",
                phone="9800000012",
                full_name="Southern Super Distributor",
                business_name="Deccan Spark Distribution",
                territory="Southern Region",
                hashed_password=get_password_hash("SuperDistPass#2026"),
                role=UserRole.SUPER_DISTRIBUTOR,
                status=UserStatus.ACTIVE,
                parent_id=admin.id,
            )
            db.add(sd_south)
            print("Created SD South: sd.south@buymecart.org")
        db.flush()

        # AD South
        ad_south = db.query(User).filter(User.login_id == "ad.south1@buymecart.org").first()
        if not ad_south:
            ad_south = User(
                id=uuid.uuid4(),
                login_id="ad.south1@buymecart.org",
                email="ad.south1@buymecart.org",
                phone="9800000013",
                full_name="Zone-South-01 Area Distributor",
                business_name="Chennai FinLink Services",
                territory="Zone-South-01",
                hashed_password=get_password_hash("AreaDistPass#2026"),
                role=UserRole.AREA_DISTRIBUTOR,
                status=UserStatus.ACTIVE,
                parent_id=sd_south.id,
            )
            db.add(ad_south)
            print("Created AD South: ad.south1@buymecart.org")
        db.flush()

        # Retailer South
        ret_south = db.query(User).filter(User.login_id == "retailer.south1@buymecart.org").first()
        if not ret_south:
            ret_south = User(
                id=uuid.uuid4(),
                login_id="retailer.south1@buymecart.org",
                email="retailer.south1@buymecart.org",
                phone="9800000014",
                full_name="Chennai Retail Store",
                business_name="Anna Nagar Mart",
                territory="Zone-South-01",
                hashed_password=get_password_hash("RetailerPass#2026"),
                role=UserRole.RETAILER,
                status=UserStatus.ACTIVE,
                parent_id=ad_south.id,
            )
            db.add(ret_south)
            print("Created Retailer South: retailer.south1@buymecart.org")
        db.flush()

        ret_south_wallet = db.query(FinancialAccount).filter(FinancialAccount.user_id == ret_south.id).first()
        if not ret_south_wallet:
            ret_south_wallet = FinancialAccount(
                id=uuid.uuid4(),
                account_number=f"ACC-WALLET-{ret_south.login_id[:8].upper()}-002",
                user_id=ret_south.id,
                account_type=AccountType.MERCHANT_WALLET,
                currency="INR",
                current_balance=Decimal("25000.0000"),
                reserved_balance=Decimal("0.0000"),
            )
            db.add(ret_south_wallet)
            print(f"Created Merchant Wallet for {ret_south.login_id} with INR 25,000.00 test balance")

        db.commit()
        print("\n=== UAT Seed Successful ===")
        print("Test Accounts Ready for UAT:")
        print("  1. Admin:              admin@buymecart.org / AdminPass#2026")
        print("  2. Super Distributor:  sd.central@buymecart.org / SuperDistPass#2026")
        print("  3. Area Distributor:   ad.zone1@buymecart.org / AreaDistPass#2026")
        print("  4. Retailer:           retailer.store1@buymecart.org / RetailerPass#2026 (Wallet: INR 50,000)")
        print("  5. Cross-SD (South):   sd.south@buymecart.org / SuperDistPass#2026")
        print("  6. Cross-AD (South):   ad.south1@buymecart.org / AreaDistPass#2026")
        print("  7. Cross-Ret (South):  retailer.south1@buymecart.org / RetailerPass#2026 (Wallet: INR 25,000)")

    except Exception as exc:
        db.rollback()
        print(f"Error seeding database: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_uat_environment()

"""Link KYC dossiers to existing merchants and prevent duplicate open dossiers.

Revision ID: 007_merchant_kyc_dossiers
Revises: 006_bspark_gateway_and_banking_api
Create Date: 2026-10-21
"""
from alembic import op
import sqlalchemy as sa


revision = "007_merchant_kyc_dossiers"
down_revision = "006_bspark_gateway_and_banking_api"
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table("onboarding_applications") as batch_op:
        batch_op.add_column(sa.Column("target_merchant_id", sa.Uuid(), nullable=True))
        batch_op.create_foreign_key(
            "fk_onboarding_applications_target_merchant_id_users",
            "users",
            ["target_merchant_id"],
            ["id"],
            ondelete="SET NULL",
        )
    op.create_index(
        "ix_onboarding_applications_target_merchant_id",
        "onboarding_applications",
        ["target_merchant_id"],
    )
    op.create_index(
        "uq_open_merchant_kyc_dossier",
        "onboarding_applications",
        ["target_merchant_id"],
        unique=True,
        sqlite_where=sa.text(
            "target_merchant_id IS NOT NULL AND status IN ('DRAFT', 'CORRECTION_REQUIRED', 'UNDER_REVIEW')"
        ),
        postgresql_where=sa.text(
            "target_merchant_id IS NOT NULL AND status IN ('DRAFT', 'CORRECTION_REQUIRED', 'UNDER_REVIEW')"
        ),
    )


def downgrade() -> None:
    op.drop_index("uq_open_merchant_kyc_dossier", table_name="onboarding_applications")
    op.drop_index("ix_onboarding_applications_target_merchant_id", table_name="onboarding_applications")
    with op.batch_alter_table("onboarding_applications") as batch_op:
        batch_op.drop_constraint("fk_onboarding_applications_target_merchant_id_users", type_="foreignkey")
        batch_op.drop_column("target_merchant_id")

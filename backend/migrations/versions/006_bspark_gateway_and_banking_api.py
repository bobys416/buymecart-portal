"""bspark gateway and banking api integration schema

Revision ID: 006_bspark_gateway_and_banking_api
Revises: 005_provider_adapters_and_reconciliation
Create Date: 2026-10-21 15:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "006_bspark_gateway_and_banking_api"
down_revision = "005_provider_adapters_and_reconciliation"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Create banking_provider_configs table
    op.create_table(
        "banking_provider_configs",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("provider_id", sa.String(length=50), nullable=False),
        sa.Column("provider_name", sa.String(length=100), nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("base_url", sa.String(length=255), nullable=False),
        sa.Column("credential_vault_ref", sa.String(length=255), nullable=False),
        sa.Column("webhook_secret_ref", sa.String(length=255), nullable=True),
        sa.Column("environment", sa.String(length=20), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("supported_rails_json", sa.Text(), nullable=False),
        sa.Column("capabilities_json", sa.Text(), nullable=False),
        sa.Column("routing_priority", sa.Integer(), server_default="1", nullable=False),
        sa.Column("timeout_ms", sa.Integer(), server_default="15000", nullable=False),
        sa.Column("max_retries", sa.Integer(), server_default="3", nullable=False),
        sa.Column("is_production_approved", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("approved_by", sa.String(length=100), nullable=True),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("provider_id"),
    )
    op.create_index("ix_banking_provider_configs_provider_id", "banking_provider_configs", ["provider_id"])

    # 2. Create api_products table
    op.create_table(
        "api_products",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("product_code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("version", sa.String(length=20), server_default="v1", nullable=False),
        sa.Column("category", sa.String(length=50), nullable=False),
        sa.Column("base_fee", sa.Numeric(precision=12, scale=4), server_default="0.0000", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="1", nullable=False),
        sa.Column("rate_limit_per_minute", sa.Integer(), server_default="60", nullable=False),
        sa.Column("documentation_url", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("product_code"),
    )
    op.create_index("ix_api_products_product_code", "api_products", ["product_code"])

    # 3. Create api_client_credentials table
    op.create_table(
        "api_client_credentials",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("client_id", sa.String(length=50), nullable=False),
        sa.Column("client_name", sa.String(length=100), nullable=False),
        sa.Column("hashed_client_secret", sa.String(length=64), nullable=False),
        sa.Column("status", sa.String(length=20), server_default="ACTIVE", nullable=False),
        sa.Column("allowed_product_codes_json", sa.Text(), nullable=False),
        sa.Column("rate_limit_per_minute", sa.Integer(), server_default="120", nullable=False),
        sa.Column("daily_quota", sa.Integer(), server_default="10000", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("client_id"),
    )
    op.create_index("ix_api_client_credentials_client_id", "api_client_credentials", ["client_id"])


def downgrade() -> None:
    op.drop_table("api_client_credentials")
    op.drop_table("api_products")
    op.drop_table("banking_provider_configs")

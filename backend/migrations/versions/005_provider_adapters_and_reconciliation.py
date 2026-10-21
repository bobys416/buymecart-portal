"""provider adapters and reconciliation schema additions

Revision ID: 005_provider_adapters_and_reconciliation
Revises: 004_financial_ledger_schema
Create Date: 2026-10-21 12:30:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "005_provider_adapters_and_reconciliation"
down_revision = "004_financial_ledger_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. Alter transactions with retry and inquiry tracking columns
    with op.batch_alter_table("transactions") as batch_op:
        batch_op.add_column(sa.Column("retry_count", sa.Integer(), server_default="0", nullable=False))
        batch_op.add_column(sa.Column("max_retries", sa.Integer(), server_default="3", nullable=False))
        batch_op.add_column(sa.Column("next_retry_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.add_column(sa.Column("last_inquiry_at", sa.DateTime(timezone=True), nullable=True))
        batch_op.create_index("ix_transactions_next_retry", ["next_retry_at"])

    # 2. Alter provider_reconciliation_records with discrepancy breakdown columns
    with op.batch_alter_table("provider_reconciliation_records") as batch_op:
        batch_op.add_column(sa.Column("discrepancy_type", sa.String(length=50), nullable=True))
        batch_op.add_column(sa.Column("expected_amount", sa.Numeric(precision=18, scale=4), nullable=True))
        batch_op.add_column(sa.Column("settled_amount", sa.Numeric(precision=18, scale=4), nullable=True))
        batch_op.add_column(sa.Column("resolved", sa.Boolean(), server_default="0", nullable=False))
        batch_op.add_column(sa.Column("resolution_notes", sa.String(length=500), nullable=True))

    # 3. Create incoming_webhook_events table for durable, persistent replay protection
    op.create_table(
        "incoming_webhook_events",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("provider_id", sa.String(length=50), nullable=False),
        sa.Column("event_id", sa.String(length=128), nullable=False),
        sa.Column("payload_hash", sa.String(length=64), nullable=False),
        sa.Column("signature", sa.String(length=256), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("error_details", sa.Text(), nullable=True),
        sa.Column("processed_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id"),
    )
    op.create_index("ix_incoming_webhooks_event_id", "incoming_webhook_events", ["event_id"])
    op.create_index("ix_incoming_webhooks_provider", "incoming_webhook_events", ["provider_id"])
    op.create_index("ix_incoming_webhooks_status", "incoming_webhook_events", ["status"])


def downgrade() -> None:
    op.drop_index("ix_incoming_webhooks_status", table_name="incoming_webhook_events")
    op.drop_index("ix_incoming_webhooks_provider", table_name="incoming_webhook_events")
    op.drop_index("ix_incoming_webhooks_event_id", table_name="incoming_webhook_events")
    op.drop_table("incoming_webhook_events")

    with op.batch_alter_table("provider_reconciliation_records") as batch_op:
        batch_op.drop_column("resolution_notes")
        batch_op.drop_column("resolved")
        batch_op.drop_column("settled_amount")
        batch_op.drop_column("expected_amount")
        batch_op.drop_column("discrepancy_type")

    with op.batch_alter_table("transactions") as batch_op:
        batch_op.drop_index("ix_transactions_next_retry")
        batch_op.drop_column("last_inquiry_at")
        batch_op.drop_column("next_retry_at")
        batch_op.drop_column("max_retries")
        batch_op.drop_column("retry_count")

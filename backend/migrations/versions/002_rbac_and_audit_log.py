"""RBAC extensions and append-only audit trail schema

Revision ID: 002_rbac_and_audit_log
Revises: 001_initial_user_schema
Create Date: 2026-10-21 00:00:01.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "002_rbac_and_audit_log"
down_revision: Union[str, None] = "001_initial_user_schema"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add business_name and territory to users
    op.add_column("users", sa.Column("business_name", sa.String(length=255), nullable=True))
    op.add_column("users", sa.Column("territory", sa.String(length=100), nullable=True))
    op.create_index("ix_users_territory", "users", ["territory"], unique=False)

    # 2. Create append-only audit_logs table
    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False),
        sa.Column("actor_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("actor_login_id", sa.String(length=100), nullable=True),
        sa.Column("actor_role", sa.String(length=50), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("target_id", sa.Uuid(), nullable=True),
        sa.Column("target_type", sa.String(length=50), server_default="USER", nullable=False),
        sa.Column("metadata_json", sa.Text(), nullable=True),
        sa.Column("actor_ip", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    op.create_index("ix_audit_logs_actor_id", "audit_logs", ["actor_id"], unique=False)
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"], unique=False)
    op.create_index("ix_audit_logs_target_id", "audit_logs", ["target_id"], unique=False)
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"], unique=False)


def downgrade() -> None:
    op.drop_index("ix_audit_logs_created_at", table_name="audit_logs")
    op.drop_index("ix_audit_logs_target_id", table_name="audit_logs")
    op.drop_index("ix_audit_logs_action", table_name="audit_logs")
    op.drop_index("ix_audit_logs_actor_id", table_name="audit_logs")
    op.drop_table("audit_logs")

    op.drop_index("ix_users_territory", table_name="users")
    op.drop_column("users", "territory")
    op.drop_column("users", "business_name")

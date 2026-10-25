"""Create user_sessions, login_events, and security_alerts tables"""

# revision identifiers, used by Alembic.
revision = "010_security_sessions_and_alerts"
down_revision = "009_otp_challenges"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
import uuid


def _table_exists(table: str) -> bool:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table in inspector.get_table_names()


def upgrade() -> None:
    # ── User Sessions ──
    if not _table_exists("user_sessions"):
        op.create_table(
            "user_sessions",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False, default=uuid.uuid4),
            sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("refresh_jti", sa.String(255), nullable=False, unique=True, index=True),
            sa.Column("device_name", sa.String(255), nullable=True),
            sa.Column("device_type", sa.String(50), nullable=True),
            sa.Column("user_agent", sa.String(500), nullable=True),
            sa.Column("ip_address", sa.String(50), nullable=True),
            sa.Column("auth_method", sa.String(50), nullable=False, server_default="password"),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("revoked_reason", sa.String(100), nullable=True),
            sa.Column("last_activity_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )

    # ── Login Events ──
    if not _table_exists("login_events"):
        op.create_table(
            "login_events",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False, default=uuid.uuid4),
            sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("login_id_attempted", sa.String(255), nullable=False, index=True),
            sa.Column("result", sa.String(30), nullable=False, index=True),
            sa.Column("auth_method", sa.String(50), nullable=False, server_default="password"),
            sa.Column("ip_address", sa.String(50), nullable=True, index=True),
            sa.Column("user_agent", sa.String(500), nullable=True),
            sa.Column("failure_reason", sa.String(255), nullable=True),
            sa.Column("session_id", sa.Uuid(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
        )

    # ── Security Alerts ──
    if not _table_exists("security_alerts"):
        op.create_table(
            "security_alerts",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False, default=uuid.uuid4),
            sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True),
            sa.Column("alert_type", sa.String(100), nullable=False, index=True),
            sa.Column("severity", sa.String(20), nullable=False, index=True),
            sa.Column("message", sa.Text(), nullable=False),
            sa.Column("ip_address", sa.String(50), nullable=True),
            sa.Column("metadata_json", sa.Text(), nullable=True),
            sa.Column("is_resolved", sa.Boolean(), nullable=False, server_default=sa.text("false")),
            sa.Column("resolved_by", sa.Uuid(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
            sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False, index=True),
        )


def downgrade() -> None:
    op.drop_table("security_alerts")
    op.drop_table("login_events")
    op.drop_table("user_sessions")

"""Create OTP challenges table for email/SMS verification and MFA"""

# revision identifiers, used by Alembic.
revision = "009_otp_challenges"
down_revision = "008_user_verification_external_identity"
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
    if _table_exists("otp_challenges"):
        return

    op.create_table(
        "otp_challenges",
        sa.Column("id", sa.Uuid(), primary_key=True, nullable=False, default=uuid.uuid4),
        sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
        sa.Column("channel", sa.String(length=20), nullable=False),
        sa.Column("purpose", sa.String(length=30), nullable=False),
        sa.Column("hashed_code", sa.String(length=255), nullable=False),
        sa.Column("destination", sa.String(length=255), nullable=False),
        sa.Column("attempts", sa.Integer(), default=0, nullable=False),
        sa.Column("max_attempts", sa.Integer(), default=5, nullable=False),
        sa.Column("is_verified", sa.Boolean(), default=False, nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("otp_challenges")

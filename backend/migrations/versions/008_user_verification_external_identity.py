"""Add verification flags to users and create external_identity table"""

# revision identifiers, used by Alembic.
revision = "008_user_verification_external_identity"
down_revision = "007_merchant_kyc_dossiers"
branch_labels = None
depends_on = None

from alembic import op
import sqlalchemy as sa
import uuid


def _column_exists(table: str, column: str) -> bool:
    """Check whether a column already exists in a table (SQLite + PostgreSQL)."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [c["name"] for c in inspector.get_columns(table)]
    return column in columns


def _table_exists(table: str) -> bool:
    """Check whether a table already exists."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table in inspector.get_table_names()


def upgrade() -> None:
    # --- Add verification columns to users (idempotent) ---
    if not _column_exists("users", "email_verified"):
        op.add_column("users", sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    if not _column_exists("users", "phone_verified"):
        op.add_column("users", sa.Column("phone_verified", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    if not _column_exists("users", "mfa_enrolled"):
        op.add_column("users", sa.Column("mfa_enrolled", sa.Boolean(), nullable=False, server_default=sa.text("false")))

    # --- Create external_identities table (idempotent) ---
    # index=True on columns auto-creates indexes, so no separate create_index needed.
    if not _table_exists("external_identities"):
        op.create_table(
            "external_identities",
            sa.Column("id", sa.Uuid(), primary_key=True, nullable=False, default=uuid.uuid4),
            sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("provider", sa.Enum("MICROSOFT_ENTRA", name="identityprovider"), nullable=False, index=True),
            sa.Column("provider_subject", sa.String(length=255), nullable=False, index=True),
            sa.Column("display_name", sa.String(length=255), nullable=True),
            sa.Column("email", sa.String(length=255), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        )


def downgrade() -> None:
    op.drop_table("external_identities")
    op.drop_column("users", "mfa_enrolled")
    op.drop_column("users", "phone_verified")
    op.drop_column("users", "email_verified")

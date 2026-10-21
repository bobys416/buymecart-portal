"""create onboarding and kyc tables

Revision ID: 003_onboarding_and_kyc_schema
Revises: 002_rbac_and_audit_log
Create Date: 2026-10-21 11:15:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "003_onboarding_and_kyc_schema"
down_revision = "002_rbac_and_audit_log"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. onboarding_applications
    op.create_table(
        "onboarding_applications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("application_number", sa.String(length=50), nullable=False),
        sa.Column("applicant_role", sa.String(length=50), nullable=False),
        sa.Column("status", sa.String(length=50), server_default="DRAFT", nullable=False),
        sa.Column("initiator_id", sa.Uuid(), nullable=True),
        sa.Column("parent_distributor_id", sa.Uuid(), nullable=True),
        sa.Column("territory", sa.String(length=100), nullable=True),
        sa.Column("assigned_reviewer_id", sa.Uuid(), nullable=True),
        sa.Column("activated_user_id", sa.Uuid(), nullable=True),
        sa.Column("correction_reason", sa.String(length=1000), nullable=True),
        sa.Column("rejection_reason", sa.String(length=1000), nullable=True),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("activated_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("version", sa.Integer(), server_default="1", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["initiator_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["parent_distributor_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["assigned_reviewer_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["activated_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("application_number"),
    )
    op.create_index("ix_onboarding_applications_app_num", "onboarding_applications", ["application_number"])
    op.create_index("ix_onboarding_applications_role", "onboarding_applications", ["applicant_role"])
    op.create_index("ix_onboarding_applications_status", "onboarding_applications", ["status"])
    op.create_index("ix_onboarding_applications_parent", "onboarding_applications", ["parent_distributor_id"])
    op.create_index("ix_onboarding_applications_territory", "onboarding_applications", ["territory"])

    # 2. application_profiles
    op.create_table(
        "application_profiles",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("application_id", sa.Uuid(), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("rmn", sa.String(length=20), nullable=False),
        sa.Column("alternate_mobile", sa.String(length=20), nullable=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("dob", sa.String(length=20), nullable=True),
        sa.Column("mobile_verified", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("email_verified", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("business_name", sa.String(length=255), nullable=True),
        sa.Column("shop_name", sa.String(length=255), nullable=True),
        sa.Column("category", sa.String(length=100), nullable=True),
        sa.Column("business_type", sa.String(length=100), server_default="Individual", nullable=True),
        sa.Column("shop_address", sa.String(length=500), nullable=True),
        sa.Column("country", sa.String(length=100), server_default="India", nullable=False),
        sa.Column("state", sa.String(length=100), nullable=True),
        sa.Column("district", sa.String(length=100), nullable=True),
        sa.Column("city", sa.String(length=100), nullable=True),
        sa.Column("pin_code", sa.String(length=20), nullable=True),
        sa.Column("landmark", sa.String(length=255), nullable=True),
        sa.Column("geo_coords", sa.String(length=100), nullable=True),
        sa.Column("msme_udyam_number", sa.String(length=50), nullable=True),
        sa.Column("registration_number", sa.String(length=100), nullable=True),
        sa.Column("pan_number", sa.String(length=20), nullable=True),
        sa.Column("pan_verified", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("aadhaar_last_four", sa.String(length=10), nullable=True),
        sa.Column("aadhaar_verified", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("address_proof_type", sa.String(length=50), nullable=True),
        sa.Column("vkyc_duration_seconds", sa.Integer(), server_default="0", nullable=False),
        sa.Column("vkyc_code_recited", sa.String(length=50), nullable=True),
        sa.Column("vkyc_status", sa.String(length=50), server_default="Not Started", nullable=False),
        sa.Column("vkyc_consent_given", sa.Boolean(), server_default="0", nullable=False),
        sa.Column("vkyc_reviewer_remarks", sa.String(length=500), nullable=True),
        sa.Column("vkyc_provider_reference", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["onboarding_applications.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("application_id"),
    )
    op.create_index("ix_app_profiles_rmn", "application_profiles", ["rmn"])
    op.create_index("ix_app_profiles_email", "application_profiles", ["email"])
    op.create_index("ix_app_profiles_pan", "application_profiles", ["pan_number"])

    # 3. kyc_documents
    op.create_table(
        "kyc_documents",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("application_id", sa.Uuid(), nullable=False),
        sa.Column("document_type", sa.String(length=50), nullable=False),
        sa.Column("label", sa.String(length=100), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("required", sa.Boolean(), server_default="1", nullable=False),
        sa.Column("status", sa.String(length=50), server_default="NOT_UPLOADED", nullable=False),
        sa.Column("storage_path", sa.String(length=500), nullable=True),
        sa.Column("original_filename", sa.String(length=255), nullable=True),
        sa.Column("file_size_bytes", sa.Integer(), nullable=True),
        sa.Column("mime_type", sa.String(length=100), nullable=True),
        sa.Column("sha256_checksum", sa.String(length=64), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reviewer_remarks", sa.String(length=500), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["onboarding_applications.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_kyc_documents_app_id", "kyc_documents", ["application_id"])
    op.create_index("ix_kyc_documents_type", "kyc_documents", ["document_type"])
    op.create_index("ix_kyc_documents_status", "kyc_documents", ["status"])

    # 4. bank_account_verifications
    op.create_table(
        "bank_account_verifications",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("application_id", sa.Uuid(), nullable=False),
        sa.Column("account_holder_name", sa.String(length=255), nullable=False),
        sa.Column("bank_name", sa.String(length=255), nullable=False),
        sa.Column("account_number_masked", sa.String(length=50), nullable=False),
        sa.Column("account_number_hash", sa.String(length=64), nullable=False),
        sa.Column("account_number_encrypted", sa.String(length=255), nullable=True),
        sa.Column("ifsc_code", sa.String(length=20), nullable=False),
        sa.Column("account_type", sa.String(length=50), server_default="Current", nullable=False),
        sa.Column("branch", sa.String(length=255), nullable=True),
        sa.Column("proof_doc_id", sa.Uuid(), nullable=True),
        sa.Column("verification_status", sa.String(length=50), server_default="PENDING", nullable=False),
        sa.Column("penny_drop_reference", sa.String(length=100), nullable=True),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("verified_by_id", sa.Uuid(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["onboarding_applications.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["proof_doc_id"], ["kyc_documents.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["verified_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("application_id"),
    )
    op.create_index("ix_bank_verifications_app_id", "bank_account_verifications", ["application_id"])
    op.create_index("ix_bank_verifications_hash", "bank_account_verifications", ["account_number_hash"])

    # 5. application_reviews
    op.create_table(
        "application_reviews",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("application_id", sa.Uuid(), nullable=False),
        sa.Column("reviewer_id", sa.Uuid(), nullable=False),
        sa.Column("action", sa.String(length=50), nullable=False),
        sa.Column("remarks", sa.String(length=1000), nullable=True),
        sa.Column("correction_fields_json", sa.String(length=2000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["onboarding_applications.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["reviewer_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_app_reviews_app_id", "application_reviews", ["application_id"])
    op.create_index("ix_app_reviews_reviewer_id", "application_reviews", ["reviewer_id"])

    # 6. application_status_history
    op.create_table(
        "application_status_history",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("application_id", sa.Uuid(), nullable=False),
        sa.Column("from_status", sa.String(length=50), nullable=False),
        sa.Column("to_status", sa.String(length=50), nullable=False),
        sa.Column("actor_id", sa.Uuid(), nullable=True),
        sa.Column("actor_role", sa.String(length=50), nullable=True),
        sa.Column("reason", sa.String(length=1000), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["onboarding_applications.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_app_status_hist_app_id", "application_status_history", ["application_id"])

    # 7. consent_records
    op.create_table(
        "consent_records",
        sa.Column("id", sa.Uuid(), nullable=False),
        sa.Column("application_id", sa.Uuid(), nullable=False),
        sa.Column("consent_type", sa.String(length=50), nullable=False),
        sa.Column("ip_address", sa.String(length=50), nullable=True),
        sa.Column("user_agent", sa.String(length=255), nullable=True),
        sa.Column("consent_text_version", sa.String(length=50), server_default="v1.0", nullable=False),
        sa.Column("granted_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["application_id"], ["onboarding_applications.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_consent_records_app_id", "consent_records", ["application_id"])


def downgrade() -> None:
    op.drop_table("consent_records")
    op.drop_table("application_status_history")
    op.drop_table("application_reviews")
    op.drop_table("bank_account_verifications")
    op.drop_table("kyc_documents")
    op.drop_table("application_profiles")
    op.drop_table("onboarding_applications")

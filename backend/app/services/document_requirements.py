from typing import Any, Dict, List
from app.models.onboarding import KycDocumentType
from app.models.user import UserRole


def get_required_documents_for_application(
    role: UserRole,
    business_type: str = "Individual",
    msme_number_provided: bool = False,
) -> List[Dict[str, Any]]:
    """
    Returns the document checklist based on applicant role, business structure, and compliance policy.
    Ensures document requirements are configurable and not identically hardcoded for every tier.
    """
    docs: List[Dict[str, Any]] = [
        {
            "document_type": KycDocumentType.PAN_CARD,
            "label": "PAN Card Copy",
            "description": "Clear color copy of Permanent Account Number (PAN) card of applicant/entity.",
            "required": True,
        },
        {
            "document_type": KycDocumentType.AADHAAR_FRONT,
            "label": "Aadhaar Card (Front)",
            "description": "Front face of Aadhaar card showing name, DOB, and masked UID.",
            "required": True,
        },
        {
            "document_type": KycDocumentType.AADHAAR_BACK,
            "label": "Aadhaar Card (Back)",
            "description": "Back face of Aadhaar card showing complete residential address.",
            "required": True,
        },
        {
            "document_type": KycDocumentType.BANK_PROOF,
            "label": "Bank Proof (Cancelled Cheque or Statement)",
            "description": "Cancelled cheque with printed name or recent bank statement showing IFSC and account details.",
            "required": True,
        },
        {
            "document_type": KycDocumentType.MERCHANT_SELFIE,
            "label": "Applicant Live Photograph",
            "description": "Recent color passport-style live photo of the applicant against a plain background.",
            "required": True,
        },
        {
            "document_type": KycDocumentType.SIGNATURE,
            "label": "Specimen Signature / Thumb Impression",
            "description": "Specimen signature or thumb impression on white paper.",
            "required": True,
        },
    ]

    # Role-specific requirements
    if role == UserRole.RETAILER:
        docs.extend([
            {
                "document_type": KycDocumentType.SHOP_FRONT,
                "label": "Shop Front Photograph",
                "description": "Exterior photograph showing business signboard, street view, and entrance.",
                "required": True,
            },
            {
                "document_type": KycDocumentType.SHOP_INSIDE,
                "label": "Shop Interior Photograph",
                "description": "Interior counter view of the shop or service establishment.",
                "required": False,
            },
            {
                "document_type": KycDocumentType.EMPLOYEE_SELFIE,
                "label": "Employee Selfie with Merchant",
                "description": "Verification photo of sales agent/field executive standing with the merchant (per bspark compliance).",
                "required": True,
            },
            {
                "document_type": KycDocumentType.VKYC_VIDEO,
                "label": "Video KYC (Optional for Retailer)",
                "description": "Approx 30-second video recording reciting identity statement and dynamic code.",
                "required": False,
            },
        ])
    elif role in (UserRole.AREA_DISTRIBUTOR, UserRole.SUPER_DISTRIBUTOR):
        docs.extend([
            {
                "document_type": KycDocumentType.SHOP_FRONT,
                "label": "Office / Establishment Photo",
                "description": "Exterior photograph of regional office or business premises with signage.",
                "required": True,
            },
            {
                "document_type": KycDocumentType.VKYC_VIDEO,
                "label": "Video KYC Recording (Mandatory)",
                "description": "Mandatory 30-second live Video KYC recording reciting verification code and declaration.",
                "required": True,
            },
        ])

    # Entity-specific requirements (Partnership / Pvt Ltd / LLP)
    norm_business = (business_type or "Individual").strip().lower()
    if norm_business in ["partnership", "private limited", "llp"]:
        docs.append({
            "document_type": KycDocumentType.REGISTRATION_DOC,
            "label": "Entity Registration Document",
            "description": "Certificate of Incorporation, Partnership Deed, or LLP Agreement.",
            "required": True,
        })

    if msme_number_provided or norm_business in ["sole proprietorship", "partnership", "private limited", "llp"]:
        docs.append({
            "document_type": KycDocumentType.MSME_CERTIFICATE,
            "label": "MSME / Udyam Certificate",
            "description": "Udyam Registration Certificate issued by Ministry of MSME.",
            "required": False,  # Optional unless specifically required by compliance policy
        })

    return docs

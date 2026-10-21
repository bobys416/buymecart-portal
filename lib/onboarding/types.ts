export type ApplicationRole = "Super Distributor" | "Area Distributor" | "Retailer";

export type ApplicationStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Correction Required"
  | "Approved"
  | "Rejected"
  | "Activated"
  | "Suspended";

export type DocumentVerificationStatus =
  | "Not Uploaded"
  | "Uploaded"
  | "Pending Review"
  | "Verified"
  | "Rejected"
  | "Re-upload Required"
  | "Expired";

export interface KYCDocumentItem {
  id: string;
  type: string;
  label: string;
  description: string;
  required: boolean;
  status: DocumentVerificationStatus;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  verifiedAt?: string;
  reviewerRemarks?: string;
}

export interface ApplicationReviewDecision {
  id: string;
  actor: string;
  actorRole: string;
  action: "Draft Saved" | "Submitted" | "Reviewed" | "Correction Requested" | "Approved" | "Rejected" | "Activated" | "Suspended";
  timestamp: string;
  remarks?: string;
}

export interface PersonalDetails {
  fullName: string;
  rmn: string; // Registered Mobile Number
  alternateMobile?: string;
  email: string;
  dob?: string;
  photoUrl?: string;
  mobileOtpVerified: boolean;
  emailOtpVerified: boolean;
}

export interface BusinessDetails {
  businessName: string;
  shopName: string;
  category: string;
  businessType: "Sole Proprietorship" | "Partnership" | "Private Limited" | "LLP" | "Individual";
  shopAddress: string;
  country: string;
  state: string;
  city: string;
  district: string;
  pinCode: string;
  landmark?: string;
  geoCoords: string;
  msmeUdyamNumber?: string;
  msmeCertificateUrl?: string;
  registrationNumber?: string;
  registrationDocUrl?: string;
}

export interface IdentityKycDetails {
  panNumber: string;
  panDocUrl?: string;
  panVerified: boolean;
  aadhaarMasked: string; // e.g. "•••• •••• 9012"
  aadhaarDocUrl?: string;
  aadhaarVerified: boolean;
  addressProofType: "Voter ID" | "Passport" | "Driving License" | "Electricity Bill";
  addressProofUrl?: string;
  consentTimestamp: string;
}

export interface BankDetails {
  accountHolderName: string;
  bankName: string;
  accountNumberMasked: string; // e.g. "•••• •••• 4291"
  rawAccountNumber?: string; // used internally before masking
  ifscCode: string;
  accountType: "Current" | "Savings";
  branch: string;
  chequeOrStatementUrl?: string;
  pennyDropVerified: boolean;
}

export interface MediaAndVideoKyc {
  merchantSelfieUrl?: string;
  employeeSelfieUrl?: string; // PDF requirement: Employee selfie with merchant
  shopFrontPhotoUrl?: string;
  additionalShopPhotoUrl?: string;
  signatureUrl?: string;
  vkycVideoUrl?: string;
  vkycDurationSec: number;
  vkycStatus: "Not Started" | "Recorded" | "Verified" | "Rejected";
  vkycCodeRecited?: string;
}

export interface ParentAssignmentDetails {
  assignedSDId: string;
  assignedSDName: string;
  assignedADId?: string;
  assignedADName?: string;
  agentRole: string;
  territory: string;
  eligibleServices: string[];
  serviceAuthorized: boolean;
  kitStatus: "Not Requested" | "Pending Dispatch" | "In Transit" | "Delivered";
  kitSerialNumber?: string;
  authorizedLimit?: number;
  maxSingleAdLimit?: number;
}

export interface OnboardingApplication {
  id: string; // e.g. "APP-2026-9001"
  role: ApplicationRole;
  status: ApplicationStatus;
  applicantName: string;
  businessName: string;
  rmn: string;
  email: string;
  territory: string;
  personal: PersonalDetails;
  business: BusinessDetails;
  identity: IdentityKycDetails;
  bank: BankDetails;
  media: MediaAndVideoKyc;
  hierarchy: ParentAssignmentDetails;
  documents: KYCDocumentItem[];
  reviewHistory: ApplicationReviewDecision[];
  correctionReason?: string;
  rejectionReason?: string;
  submittedAt?: string;
  approvedAt?: string;
  activatedAt?: string;
  lastUpdatedAt: string;
}

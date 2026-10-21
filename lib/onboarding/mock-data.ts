import { OnboardingApplication, ApplicationReviewDecision } from "./types";

export const initialOnboardingApplications: OnboardingApplication[] = [
  {
    id: "APP-2026-9001",
    role: "Retailer",
    status: "Under Review",
    applicantName: "Rajesh Kumar Sharma",
    businessName: "Sharma Digital Services",
    rmn: "9826012345",
    email: "rajesh.sharma@sharmadigital.in",
    territory: "Zone-01 Territory",
    personal: {
      fullName: "Rajesh Kumar Sharma",
      rmn: "9826012345",
      alternateMobile: "9826099999",
      email: "rajesh.sharma@sharmadigital.in",
      dob: "1988-04-12",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      mobileOtpVerified: true,
      emailOtpVerified: true,
    },
    business: {
      businessName: "Sharma Digital Services",
      shopName: "Sharma Digital Services",
      category: "Telecom & Financial Services",
      businessType: "Sole Proprietorship",
      shopAddress: "Plot 14, Main Market, Ward 4",
      country: "India",
      state: "Central State",
      city: "Metro City",
      district: "Zone Central",
      pinCode: "462001",
      landmark: "Opposite Grand Bus Depot",
      geoCoords: "28.6139° N, 77.2090° E",
      msmeUdyamNumber: "UDYAM-MP-02-001928",
      registrationNumber: "REG-2024-91823",
    },
    identity: {
      panNumber: "ABCDE1234F",
      panDocUrl: "/docs/pan-sample.pdf",
      panVerified: true,
      aadhaarMasked: "•••• •••• 9012",
      aadhaarDocUrl: "/docs/aadhaar-sample.pdf",
      aadhaarVerified: true,
      addressProofType: "Electricity Bill",
      addressProofUrl: "/docs/elec-bill.pdf",
      consentTimestamp: "2026-01-14T10:30:00Z",
    },
    bank: {
      accountHolderName: "Rajesh Kumar Sharma",
      bankName: "State Bank of India",
      accountNumberMasked: "•••• •••• 4291",
      rawAccountNumber: "3892019284291",
      ifscCode: "SBIN0001234",
      accountType: "Current",
      branch: "Main Market Branch",
      chequeOrStatementUrl: "/docs/cancelled-cheque.pdf",
      pennyDropVerified: true,
    },
    media: {
      merchantSelfieUrl: "/docs/selfie.jpg",
      employeeSelfieUrl: "/docs/employee-selfie.jpg",
      shopFrontPhotoUrl: "/docs/shop-front.jpg",
      additionalShopPhotoUrl: "/docs/shop-inside.jpg",
      signatureUrl: "/docs/signature.png",
      vkycVideoUrl: "/docs/vkyc-30s.mp4",
      vkycDurationSec: 31,
      vkycStatus: "Recorded",
      vkycCodeRecited: "492-019",
    },
    hierarchy: {
      assignedSDId: "SD-CENTRAL-01",
      assignedSDName: "Central Spark FinTech Pvt Ltd (Arun Singh)",
      assignedADId: "AD-ZONE-01",
      assignedADName: "Sunil Verma",
      agentRole: "Retailer",
      territory: "Zone-01 Territory",
      eligibleServices: ["AEPS", "DMT", "BBPS", "MicroATM", "UPI Collect"],
      serviceAuthorized: false,
      kitStatus: "Pending Dispatch",
      kitSerialNumber: "KIT-2026-9021",
    },
    documents: [
      {
        id: "DOC-01",
        type: "pan",
        label: "PAN Card",
        description: "Official NSDL PAN copy with clear photograph and signature",
        required: true,
        status: "Verified",
        fileName: "pan_card_verified.pdf",
        fileSize: 420000,
        mimeType: "application/pdf",
        uploadedAt: "2026-01-14 10:45 AM",
        verifiedAt: "2026-01-14 11:15 AM",
      },
      {
        id: "DOC-02",
        type: "aadhaar",
        label: "Aadhaar Proof (Masked)",
        description: "Masked Aadhaar copy displaying last 4 digits only",
        required: true,
        status: "Verified",
        fileName: "masked_aadhaar.pdf",
        fileSize: 680000,
        mimeType: "application/pdf",
        uploadedAt: "2026-01-14 10:48 AM",
        verifiedAt: "2026-01-14 11:20 AM",
      },
      {
        id: "DOC-03",
        type: "bank_proof",
        label: "Cancelled Cheque / Bank Statement",
        description: "Cheque showing name matching PAN and account details",
        required: true,
        status: "Uploaded",
        fileName: "cancelled_cheque.jpg",
        fileSize: 520000,
        mimeType: "image/jpeg",
        uploadedAt: "2026-01-14 10:52 AM",
      },
      {
        id: "DOC-04",
        type: "shop_photo",
        label: "Shop Frontage with Signboard",
        description: "Clear street-view photo with business name banner",
        required: true,
        status: "Uploaded",
        fileName: "shop_front.jpg",
        fileSize: 1200000,
        mimeType: "image/jpeg",
        uploadedAt: "2026-01-14 10:55 AM",
      },
      {
        id: "DOC-05",
        type: "employee_selfie",
        label: "Joint Field Verification Photo",
        description: "Selfie of verifying Area Distributor executive alongside merchant",
        required: true,
        status: "Uploaded",
        fileName: "joint_selfie.jpg",
        fileSize: 840000,
        mimeType: "image/jpeg",
        uploadedAt: "2026-01-14 11:00 AM",
      },
      {
        id: "DOC-06",
        type: "vkyc_video",
        label: "30-Second Live Video KYC",
        description: "Video stream of merchant reciting name, address, and verification OTP",
        required: true,
        status: "Pending Review",
        fileName: "vkyc_recording.mp4",
        fileSize: 3400000,
        mimeType: "video/mp4",
        uploadedAt: "2026-01-14 11:05 AM",
      },
    ],
    reviewHistory: [
      {
        id: "REV-01",
        actor: "Sunil Verma (AD-ZONE-01)",
        actorRole: "Area Distributor",
        action: "Submitted",
        timestamp: "2026-01-14 11:10 AM",
        remarks: "Completed 12-point KYC collection and 30s vKYC recording on site.",
      },
      {
        id: "REV-02",
        actor: "Ananya Sen (Root Admin)",
        actorRole: "Compliance Officer",
        action: "Reviewed",
        timestamp: "2026-01-14 02:20 PM",
        remarks: "PAN and Aadhaar verified. Awaiting bank statement clarity check.",
      },
    ],
    submittedAt: "2026-01-14 11:10 AM",
    lastUpdatedAt: "2026-01-14 02:20 PM",
  },
  {
    id: "APP-2026-9002",
    role: "Area Distributor",
    status: "Approved",
    applicantName: "Sunil Verma",
    businessName: "Verma Distribution & Logistics",
    rmn: "9826019921",
    email: "sunil.ad@bspark.org",
    territory: "Zone-01 Territory",
    personal: {
      fullName: "Sunil Verma",
      rmn: "9826019921",
      email: "sunil.ad@bspark.org",
      dob: "1982-09-18",
      mobileOtpVerified: true,
      emailOtpVerified: true,
    },
    business: {
      businessName: "Verma Distribution & Logistics",
      shopName: "Verma Distribution Office",
      category: "Regional Wholesale & Payments",
      businessType: "Partnership",
      shopAddress: "Office Suite 204, Commercial Complex",
      country: "India",
      state: "Central State",
      city: "Metro City",
      district: "Zone-01",
      pinCode: "462011",
      geoCoords: "28.6139° N, 77.2090° E",
      msmeUdyamNumber: "UDYAM-MP-02-998811",
    },
    identity: {
      panNumber: "PQRST5678G",
      panVerified: true,
      aadhaarMasked: "•••• •••• 1122",
      aadhaarVerified: true,
      addressProofType: "Electricity Bill",
      consentTimestamp: "2026-01-10T09:00:00Z",
    },
    bank: {
      accountHolderName: "Verma Distribution & Logistics",
      bankName: "HDFC Bank",
      accountNumberMasked: "•••• •••• 8844",
      rawAccountNumber: "50200019288844",
      ifscCode: "HDFC0000123",
      accountType: "Current",
      branch: "Commercial Hub",
      pennyDropVerified: true,
    },
    media: {
      merchantSelfieUrl: "/docs/sunil-selfie.jpg",
      signatureUrl: "/docs/sunil-sign.png",
      vkycDurationSec: 32,
      vkycStatus: "Verified",
    },
    hierarchy: {
      assignedSDId: "SD-CENTRAL-01",
      assignedSDName: "Central Spark FinTech Pvt Ltd",
      agentRole: "Area Distributor",
      territory: "Zone-01 Territory",
      eligibleServices: ["Retailer Onboarding", "Kit Distribution", "Payment Escalation"],
      serviceAuthorized: true,
      kitStatus: "Delivered",
      authorizedLimit: 2000000,
    },
    documents: [],
    reviewHistory: [
      {
        id: "REV-10",
        actor: "Arun Singh (SD-CENTRAL-01)",
        actorRole: "Super Distributor",
        action: "Submitted",
        timestamp: "2026-01-10 10:00 AM",
        remarks: "Proposed for Zone-01 coverage.",
      },
      {
        id: "REV-11",
        actor: "Ananya Sen (Root Admin)",
        actorRole: "Admin",
        action: "Approved",
        timestamp: "2026-01-11 04:30 PM",
        remarks: "Full compliance verified. AD ID assigned: AD-ZONE-01.",
      },
    ],
    submittedAt: "2026-01-10 10:00 AM",
    approvedAt: "2026-01-11 04:30 PM",
    activatedAt: "2026-01-11 04:30 PM",
    lastUpdatedAt: "2026-01-11 04:30 PM",
  },
  {
    id: "APP-2026-9003",
    role: "Super Distributor",
    status: "Activated",
    applicantName: "Arun Singh",
    businessName: "Central Spark FinTech Pvt Ltd",
    rmn: "9826019921",
    email: "arun.sd@bspark.org",
    territory: "Central India Region",
    personal: {
      fullName: "Arun Singh",
      rmn: "9826019921",
      email: "arun.sd@bspark.org",
      dob: "1975-11-22",
      mobileOtpVerified: true,
      emailOtpVerified: true,
    },
    business: {
      businessName: "Central Spark FinTech Pvt Ltd",
      shopName: "Central Regional Command",
      category: "Fintech Distribution Corporate",
      businessType: "Private Limited",
      shopAddress: "Tower B, Fintech IT Park, Ring Road",
      country: "India",
      state: "Central State",
      city: "Metro City",
      district: "Division HQ",
      pinCode: "462022",
      geoCoords: "28.6139° N, 77.2090° E",
      msmeUdyamNumber: "UDYAM-MP-00-112233",
      registrationNumber: "U72900MP2022PTC061234",
    },
    identity: {
      panNumber: "AABCC1234E",
      panVerified: true,
      aadhaarMasked: "•••• •••• 5544",
      aadhaarVerified: true,
      addressProofType: "Electricity Bill",
      consentTimestamp: "2025-06-10T11:00:00Z",
    },
    bank: {
      accountHolderName: "Central Spark FinTech Pvt Ltd",
      bankName: "ICICI Bank",
      accountNumberMasked: "•••• •••• 9901",
      rawAccountNumber: "001205009901",
      ifscCode: "ICIC0000012",
      accountType: "Current",
      branch: "Corporate Banking Branch",
      pennyDropVerified: true,
    },
    media: {
      signatureUrl: "/docs/arun-sign.png",
      vkycDurationSec: 35,
      vkycStatus: "Verified",
    },
    hierarchy: {
      assignedSDId: "GLOBAL_ROOT",
      assignedSDName: "Buymecart Root Operations",
      agentRole: "Super Distributor",
      territory: "Central India Region",
      eligibleServices: ["AD Management", "Balance Query Resolution", "Limit Allocation"],
      serviceAuthorized: true,
      kitStatus: "Delivered",
      authorizedLimit: 25000000,
      maxSingleAdLimit: 2500000,
    },
    documents: [],
    reviewHistory: [
      {
        id: "REV-20",
        actor: "Root Administrator",
        actorRole: "Admin",
        action: "Activated",
        timestamp: "2025-06-15 09:00 AM",
        remarks: "Root Super Distributor credentials and authorized limit of ₹2.5 Cr approved.",
      },
    ],
    submittedAt: "2025-06-12 11:00 AM",
    approvedAt: "2025-06-15 09:00 AM",
    activatedAt: "2025-06-15 09:00 AM",
    lastUpdatedAt: "2025-06-15 09:00 AM",
  },
  {
    id: "APP-2026-9004",
    role: "Retailer",
    status: "Correction Required",
    applicantName: "Vinod Meena",
    businessName: "Metro Kirana & General Store",
    rmn: "9826054321",
    email: "vinod.meena@kiranametro.in",
    territory: "Zone-01 Territory",
    personal: {
      fullName: "Vinod Meena",
      rmn: "9826054321",
      email: "vinod.meena@kiranametro.in",
      mobileOtpVerified: true,
      emailOtpVerified: false,
    },
    business: {
      businessName: "Metro Kirana & General Store",
      shopName: "Metro Kirana Mart",
      category: "Grocery & Provisions",
      businessType: "Sole Proprietorship",
      shopAddress: "Shop 12, Subhash Marg, Ward 9",
      country: "India",
      state: "Central State",
      city: "Metro City",
      district: "Zone-01",
      pinCode: "462002",
      geoCoords: "28.6139° N, 77.2090° E",
    },
    identity: {
      panNumber: "KLMNO9876P",
      panVerified: false,
      aadhaarMasked: "•••• •••• 3344",
      aadhaarVerified: true,
      addressProofType: "Voter ID",
      consentTimestamp: "2026-01-16T14:00:00Z",
    },
    bank: {
      accountHolderName: "Vinod Meena",
      bankName: "Bank of Baroda",
      accountNumberMasked: "•••• •••• 7712",
      rawAccountNumber: "1298010007712",
      ifscCode: "BARB0METROX",
      accountType: "Savings",
      branch: "Subhash Marg",
      pennyDropVerified: false,
    },
    media: {
      vkycDurationSec: 0,
      vkycStatus: "Not Started",
    },
    hierarchy: {
      assignedSDId: "SD-CENTRAL-01",
      assignedSDName: "Central Spark FinTech Pvt Ltd",
      assignedADId: "AD-ZONE-01",
      assignedADName: "Sunil Verma",
      agentRole: "Retailer",
      territory: "Zone-01 Territory",
      eligibleServices: ["DMT", "BBPS"],
      serviceAuthorized: false,
      kitStatus: "Not Requested",
    },
    documents: [],
    reviewHistory: [
      {
        id: "REV-30",
        actor: "Sunil Verma (AD-ZONE-01)",
        actorRole: "Area Distributor",
        action: "Submitted",
        timestamp: "2026-01-16 03:00 PM",
      },
      {
        id: "REV-31",
        actor: "Ananya Sen (Root Admin)",
        actorRole: "Compliance Officer",
        action: "Correction Requested",
        timestamp: "2026-01-17 11:30 AM",
        remarks: "PAN card copy is blurry. Please re-upload legible scan of PAN and complete 30-sec vKYC.",
      },
    ],
    correctionReason: "PAN card copy is blurry. Please re-upload legible scan of PAN and complete 30-sec vKYC.",
    submittedAt: "2026-01-16 03:00 PM",
    lastUpdatedAt: "2026-01-17 11:30 AM",
  },
];

// Resilient Storage helper for applications
const inMemoryAppStore: OnboardingApplication[] = [...initialOnboardingApplications];

export function getOnboardingApplications(): OnboardingApplication[] {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("buymecart_onboarding_apps");
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback to memory
    }
  }
  return inMemoryAppStore;
}

export function saveOnboardingApplication(app: OnboardingApplication): void {
  const all = getOnboardingApplications();
  const existingIdx = all.findIndex((a) => a.id === app.id);
  let updated: OnboardingApplication[];

  if (existingIdx >= 0) {
    updated = all.map((a, i) => (i === existingIdx ? app : a));
  } else {
    updated = [app, ...all];
  }

  inMemoryAppStore.length = 0;
  inMemoryAppStore.push(...updated);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("buymecart_onboarding_apps", JSON.stringify(updated));
    } catch {
      // Ignore
    }
  }
}

export function updateApplicationStatus(
  appId: string,
  newStatus: OnboardingApplication["status"],
  decision: ApplicationReviewDecision,
  additionalNotes?: string
): OnboardingApplication | null {
  const all = getOnboardingApplications();
  const target = all.find((a) => a.id === appId);
  if (!target) return null;

  const now = new Date().toISOString().replace("T", " ").slice(0, 16);
  const updatedApp: OnboardingApplication = {
    ...target,
    status: newStatus,
    lastUpdatedAt: now,
    reviewHistory: [decision, ...target.reviewHistory],
    correctionReason: newStatus === "Correction Required" ? additionalNotes : target.correctionReason,
    rejectionReason: newStatus === "Rejected" ? additionalNotes : target.rejectionReason,
    approvedAt: newStatus === "Approved" || newStatus === "Activated" ? now : target.approvedAt,
    activatedAt: newStatus === "Activated" ? now : target.activatedAt,
  };

  saveOnboardingApplication(updatedApp);
  return updatedApp;
}

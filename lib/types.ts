export type PortalRole = "admin" | "sd" | "ad" | "retailer";

export type AgentRole = "C&F" | "Master Distributor" | "Distributor" | "Retailer" | "EK" | "PO";

export type TransactionStatus = "Successful" | "Pending" | "Failed" | "Disputed" | "Refunded";

export interface Merchant {
  id: string;
  rmn: string; // Registered Mobile Number
  agentName: string;
  email: string;
  shopName: string;
  shopCategory: string;
  address: string;
  city: string;
  state: string;
  country: string;
  agentRole: AgentRole;
  aadhaarNumber: string;
  panNumber: string;
  status: "Active" | "Inactive" | "Suspended" | "Pending Approval";
  balance: number;
  dailyCredit: number;
  dailyDebit: number;
  assignedAD: string;
  assignedSD: string;
  createdAt: string;
}

export interface KYCCase {
  id: string;
  merchantId: string;
  applicantName: string;
  rmn: string;
  email: string;
  shopAddress: string;
  aadhaarNumber: string;
  panNumber: string;
  msmeUdyamNumber: string;
  mobileOtpVerified: boolean;
  emailOtpVerified: boolean;
  bankAccountNumber: string;
  ifscCode: string;
  bankStatementVerified: boolean;
  videoKycStatus: "Verified" | "Pending" | "Rejected";
  videoKycDurationSec: number;
  videoKycUrl?: string;
  merchantSelfieUrl: string;
  employeeSelfieUrl: string;
  shopPhotoUrl: string;
  signatureCaptured: boolean;
  thumbCaptured: boolean;
  geoLocation: { lat: number; lng: number; address: string };
  submittedByAD: string;
  status: "Pending Compliance" | "Approved" | "Needs Correction" | "Rejected";
  submissionDate: string;
}

export interface PaymentTransaction {
  id: string;
  rmn: string;
  retailerName: string;
  service: string;
  payMode: string;
  bank: string;
  bankRefNo: string;
  depositDate: string;
  depositAmount: number;
  calculatedFee: number;
  netSettlement: number;
  status: TransactionStatus;
  operator: string;
  circle: string;
  vendor: string;
  customerRef: string;
  category: string;
  paymentRemarks: string;
  timestamp: string;
  requiresAuthorization?: boolean;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  complaintType: "Transaction Related" | "Service Related" | "Payment Related";
  complaintCategory: string;
  transactionId?: string;
  portalRole: PortalRole;
  raisedBy: string;
  rmn: string;
  subject: string;
  remarks: string;
  status: "Open" | "In Progress" | "Resolved" | "Closed";
  priority: "High" | "Medium" | "Low";
  createdAt: string;
  slaRemaining: string;
}

export interface ManagedProductSummary {
  operator: string;
  circle: string;
  vendor: string;
  totalVolume: number;
  fivePercentVolume: number;
  sevenPercentVolume: number;
  successfulCount: number;
  unsetCount: number;
  failedCount: number;
  pendingCount: number;
  refundedCount: number;
}

export interface TemperedMarginSchedule {
  id: string;
  name: string;
  effectiveFrom: string;
  tier1: { min: number; max: number; feeRs: number }; // 101 - 1000 -> Rs 7
  tier2: { min: number; max: number; feeRs: number }; // 1001 - 2000 -> Rs 9
  tier3: { min: number; percentage: number };         // 2001+ -> 0.2% - 0.5%
  serviceOverrides: Record<string, number>;
  status: "Active" | "Draft" | "Archived";
}

export interface RetailerKitHandover {
  retailerId: string;
  retailerName: string;
  rmn: string;
  kitNumber: string;
  handoverStatus: "Delivered" | "In Transit" | "Pending Dispatch";
  qrCodeIssued: boolean;
  microAtmIssued: boolean;
  biometricScannerIssued: boolean;
  handoverDate: string;
}

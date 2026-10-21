import {
  KYCCase,
  ManagedProductSummary,
  Merchant,
  PaymentTransaction,
  RetailerKitHandover,
  SupportTicket,
  TemperedMarginSchedule,
  TransactionStatus,
} from "./types";

export type { TransactionStatus };
export type Transaction = {
  id: string;
  retailer: string;
  service: string;
  amount: number;
  status: TransactionStatus;
  provider: string;
  timestamp: string;
};

export const transactionStatuses: TransactionStatus[] = [
  "Successful",
  "Pending",
  "Failed",
  "Disputed",
];

export const formatINR = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

// Tempered-Margin Fee Calculation Utility based on Page 3 specifications
export function calculateTemperedMarginFee(amount: number, serviceName?: string): { fee: number; method: string } {
  if (amount < 101) {
    return { fee: 0, method: "Exempt (< ₹101)" };
  }
  if (amount <= 1000) {
    return { fee: 7, method: "Fixed ₹7 (Slab ₹101 - ₹1,000)" };
  }
  if (amount <= 2000) {
    return { fee: 9, method: "Fixed ₹9 (Slab ₹1,001 - ₹2,000)" };
  }
  // Default percentage for > ₹2000 is 0.35% unless overridden
  let rate = 0.0035;
  if (serviceName && serviceName.toLowerCase().includes("upi")) rate = 0.002; // 0.2%
  if (serviceName && serviceName.toLowerCase().includes("card")) rate = 0.005; // 0.5%
  if (serviceName && serviceName.toLowerCase().includes("dmt")) rate = 0.004; // 0.4%

  const fee = Math.round(amount * rate * 100) / 100;
  return { fee, method: `${(rate * 100).toFixed(2)}% Variable (Slab > ₹2,000 - No Cap)` };
}

// 1. Merchants Dataset - Clean Initial Zero State (Empty until merchants are onboarded via UI)
export const mockMerchants: Merchant[] = [];

// 2. KYC Onboarding Pipeline (Page 4) - Clean Initial Zero State
export const mockKycCases: KYCCase[] = [];

// 3. Transactions Dataset (Pages 1, 3, 4, 5) - Clean Initial Zero State
export const mockPaymentTransactions: PaymentTransaction[] = [];

export const transactions: Transaction[] = [];

// 4. Online Transaction Summary (Page 4 table) - Clean Initial Zero State
export const mockManagedProductSummaries: ManagedProductSummary[] = [];

// 5. Support Tickets Dataset (Page 4) - Clean Initial Zero State
export const mockSupportTickets: SupportTicket[] = [];

// 6. Tempered-Margin Cost Schedule (Business Rule Matrix from Page 3)
export const mockTemperedMarginSchedule: TemperedMarginSchedule = {
  id: "TMS-2026-V1",
  name: "BSpark Digitized Standard Tempered Plan",
  effectiveFrom: "2026-01-01",
  tier1: { min: 101, max: 1000, feeRs: 7 }, // Fixed ₹7 for ₹101–₹1,000
  tier2: { min: 1001, max: 2000, feeRs: 9 }, // Fixed ₹9 for ₹1,001–₹2,000
  tier3: { min: 2001, percentage: 0.35 }, // 0.35% default (no cap)
  serviceOverrides: {
    "UPI Collect / QR": 0.2, // 0.20%
    "Credit Card Payment": 0.5, // 0.50%
    "DMT Remittance": 0.4, // 0.40%
    "AEPS Cash Withdrawal": 0.35, // 0.35%
    "BBPS Utility": 0.25, // 0.25%
  },
  status: "Active",
};

// 7. Kit Handover Tracker for ADs (Page 2) - Clean Initial Zero State
export const mockKitHandovers: RetailerKitHandover[] = [];

// Baseline telemetry indicators
export const trend = [
  { day: "Mon", volume: 0 },
  { day: "Tue", volume: 0 },
  { day: "Wed", volume: 0 },
  { day: "Thu", volume: 0 },
  { day: "Fri", volume: 0 },
  { day: "Sat", volume: 0 },
  { day: "Sun", volume: 0 },
];

export const providers = [
  { name: "NPCI UPI Rail Switch", uptime: "100%", state: "Operational" },
  { name: "ICICI Corporate Open Banking", uptime: "100%", state: "Operational" },
  { name: "State Bank of India (SBI) Host-to-Host", uptime: "100%", state: "Operational" },
  { name: "Razorpay Financial Switch", uptime: "100%", state: "Operational" },
];

export const kycCases = mockKycCases.map((k) => ({
  merchant: k.applicantName,
  stage: k.status,
  age: k.submissionDate.includes("AM") ? "Today" : "Yesterday",
  owner: k.submittedByAD,
}));

export type PaymentGatewayId = "razorpay" | "upi" | "banking" | "stripe";

export type PaymentRailMode =
  | "UPI Dynamic QR"
  | "UPI Intent / Deeplink"
  | "Razorpay Standard"
  | "Stripe Card Checkout"
  | "Banking IMPS"
  | "Banking NEFT / RTGS"
  | "Aadhaar AEPS";

export interface GatewayHealthStatus {
  id: PaymentGatewayId;
  name: string;
  isConfigured: boolean;
  mode: "live" | "sandbox";
  features: string[];
  webhookEndpoint: string;
  lastPingTimestamp?: string;
}

export interface InitiatePaymentParams {
  gateway: PaymentGatewayId;
  amount: number; // in INR
  currency?: string;
  customerRef: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  serviceCategory: string;
  remarks?: string;
  // Specific for Banking IMPS/NEFT
  beneficiaryAccount?: string;
  beneficiaryIfsc?: string;
  beneficiaryName?: string;
}

export interface UnifiedPaymentOrder {
  orderId: string;
  gateway: PaymentGatewayId;
  amount: number;
  currency: string;
  fee: number;
  netSettlement: number;
  status: "created" | "pending" | "processing" | "succeeded" | "failed";
  createdAt: string;

  // Razorpay Specific
  razorpayOrderId?: string;
  razorpayKeyId?: string;

  // Stripe Specific
  stripeClientSecret?: string;
  stripePaymentIntentId?: string;
  stripePublishableKey?: string;

  // UPI Specific
  upiDeepLink?: string;
  upiQrCodeDataUrl?: string;
  upiVpa?: string;

  // Banking Specific
  bankingTxRef?: string;
  bankUtr?: string;
  beneficiaryName?: string;
  bankAccountMasked?: string;
}

export interface PaymentVerificationRequest {
  gateway: PaymentGatewayId;
  orderId: string;
  // Razorpay verification
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  // Stripe verification
  stripePaymentIntentId?: string;
  // UPI verification
  upiTxnRef?: string;
  // Banking verification
  bankUtr?: string;
}

export interface PaymentVerificationResult {
  success: boolean;
  orderId: string;
  gateway: PaymentGatewayId;
  bankRefNo: string;
  amount: number;
  fee: number;
  netSettlement: number;
  status: "Successful" | "Failed" | "Pending";
  message: string;
  verifiedAt: string;
}

export interface PennyDropVerificationRequest {
  accountNumber: string;
  ifsc: string;
  beneficiaryName?: string;
}

export interface PennyDropVerificationResult {
  valid: boolean;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  registeredName: string;
  matchScore: number;
  verificationUtr: string;
  status: "Verified" | "Failed";
  timestamp: string;
}


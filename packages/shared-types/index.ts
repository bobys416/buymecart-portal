/**
 * BuyMeCart + IBNK Multi-Platform Unified Ecosystem
 * Shared Types & Domain Contracts
 */

// ==========================================
// 1. IDENTITY & ACCESS MANAGEMENT
// ==========================================

export type PlatformRole =
  | "admin"
  | "super_distributor"
  | "area_distributor"
  | "retailer"
  | "customer";

export type PortalType = "admin" | "distributor" | "retailer" | "mobile";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: PlatformRole;
  portal: PortalType;
  orgScope: string;
  avatarUrl?: string;
  kycVerified: boolean;
  biometricsEnabled?: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}

export interface UserSession {
  user: UserProfile;
  tokens: AuthTokens;
  permissions: string[];
}

// ==========================================
// 2. E-COMMERCE DOMAIN
// ==========================================

export type ProductCategory =
  | "electronics"
  | "grocery"
  | "fashion"
  | "pos_hardware"
  | "financial_kits"
  | "stationery";

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  currency: "INR";
  stock: number;
  images: string[];
  ratings: number;
  ratingCount: number;
  isAvailable: boolean;
  supplierName?: string;
  temperedMarginEligible?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedVariant?: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  streetAddress: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
  country: "India";
  landmark?: string;
}

export type PaymentMethodType =
  | "upi"
  | "card"
  | "netbanking"
  | "wallet"
  | "cash_on_delivery"
  | "ibnk_escrow";

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned";

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  items: CartItem[];
  subtotal: number;
  temperedMarginFee: number;
  taxAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentMethod: PaymentMethodType;
  paymentStatus: "paid" | "pending" | "failed";
  orderStatus: OrderStatus;
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 3. IBNK FINANCIAL SERVICES DOMAIN
// ==========================================

export type IbnkServiceType =
  | "dmt"
  | "aeps"
  | "bbps"
  | "micro_atm"
  | "upi_switch";

export type TransactionStatus =
  | "pending"
  | "success"
  | "failed"
  | "flagged"
  | "refunded"
  | "settled";

export interface FinancialTransaction {
  id: string;
  transactionRef: string;
  rrn: string;
  utr?: string;
  serviceType: IbnkServiceType;
  retailerId: string;
  retailerName: string;
  customerIdentifier: string; // Masked phone, Aadhaar last 4, or UPI VPA
  amount: number;
  temperedMarginFee: number;
  commissionEarned: number;
  netDebit: number;
  status: TransactionStatus;
  statusMessage?: string;
  upstreamSwitch: string;
  latencyMs: number;
  createdAt: string;
  settledAt?: string;
}

/**
 * Compliance Requirement: Neutral Receipt (Page 1 Note 1)
 * Must NEVER render third-party bank or sponsor logos.
 */
export interface NeutralReceipt {
  receiptNumber: string;
  transactionRef: string;
  rrn: string;
  serviceType: IbnkServiceType;
  retailerName: string;
  retailerCode: string;
  customerIdentifier: string;
  baseAmount: number;
  serviceFee: number;
  temperedMarginFee: number;
  totalPaid: number;
  status: TransactionStatus;
  timestamp: string;
  terminalId?: string;
  qrPayload: string;
  neutralWatermark: "BUYMECART_IBNK_NEUTRAL_RECEIPT_V1";
}

export interface SwitchHealth {
  switchName: string;
  serviceType: IbnkServiceType;
  status: "operational" | "degraded" | "down";
  latencyMs: number;
  successRate: number;
  lastChecked: string;
}

export interface DisputeRequest {
  id: string;
  transactionRef: string;
  reason: "duplicate_debit" | "account_not_credited" | "terminal_timeout" | "unauthorized";
  disputeNotes: string;
  claimAmount: number;
  customerPhone: string;
  status: "open" | "under_review" | "resolved" | "rejected";
  resolutionComments?: string;
  createdAt: string;
}

// ==========================================
// 4. STATUTORY TEMPERED MARGIN RULES (Page 3)
// ==========================================

export interface TemperedMarginSchedule {
  service: IbnkServiceType;
  minAmount: number;
  maxAmount: number;
  fixedFee: number;
  percentageFee: number;
  statutoryLevyPct: number;
  retailerCommissionSharePct: number;
  distributorCommissionSharePct: number;
}

export interface TemperedMarginCalculation {
  baseAmount: number;
  serviceFee: number;
  statutoryLevy: number;
  totalCustomerDebit: number;
  retailerCommission: number;
  distributorCommission: number;
  platformNetMargin: number;
}

// ==========================================
// 5. LOCAL AI & BANKING RISK INTELLIGENCE
// ==========================================

export type RiskSeverity = "Low" | "Medium" | "High" | "Critical";

export interface BankingRiskCase {
  id: string;
  caseRef: string;
  transactionId: string;
  retailerName: string;
  retailerId: string;
  amount: number;
  service: IbnkServiceType;
  riskScore: number; // 0 to 100
  severity: RiskSeverity;
  reasonCodes: string[];
  anomaliesDetected: {
    feature: string;
    description: string;
    deviationScore: number;
  }[];
  status: "Under Review" | "Escalated" | "Cleared" | "Frozen";
  createdAt: string;
  reviewerNotes?: string;
}

export type MakerCheckerActionCode =
  | "CERT_ROTATION"
  | "SETTLEMENT_RELEASE"
  | "SWITCH_FAILOVER"
  | "ACCOUNT_FREEZE"
  | "TEMPERED_MARGIN_OVERRIDE";

export interface MakerCheckerApproval {
  id: string;
  actionCode: MakerCheckerActionCode;
  title: string;
  requesterName: string;
  requesterRole: string;
  targetTenant: string;
  proposedChanges: string;
  riskSeverity: RiskSeverity;
  status: "PENDING_DUAL_AUTH" | "APPROVED" | "REJECTED";
  makerTimestamp: string;
  checkerSignoff?: {
    checkerName: string;
    checkerTimestamp: string;
    auditJustification: string;
  };
}

export interface LocalAiTelemetry {
  runtimeEngine: "Ollama" | "vLLM" | "Llama.cpp";
  activeModel: string;
  inferenceDevice: "NVIDIA RTX / CUDA" | "Apple Metal / M-Series" | "CPU AVX-512";
  hostCpuUsagePct: number;
  systemRamGb: number;
  gpuVramUsageGb: number;
  gpuVramTotalGb: number;
  contextWindowUsedTokens: number;
  contextWindowMaxTokens: number;
  averageInferenceTokensPerSec: number;
  uptimeSeconds: number;
}

export interface AiAuditEvent {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  category: "MODEL_INFERENCE" | "MCP_TOOL_CALL" | "RISK_ALERT" | "MAKER_CHECKER" | "SECURITY";
  severity: "info" | "warning" | "critical";
  description: string;
  ipAddress?: string;
}

// ==========================================
// 6. UPSTREAM API PROVIDER & ENCLAVE MANAGEMENT
// ==========================================

export type ApiEnvironment = "sandbox" | "production";

export interface ApiProviderConfig {
  id: string;
  name: string;
  category: "banking" | "upi" | "payment_gateway" | "verification" | "bill_payment";
  environment: ApiEnvironment;
  status: "active" | "inactive" | "maintenance";
  baseUrl: string;
  authMethod: "bearer_token" | "api_key" | "mtls_cert" | "hmac_signature";
  kmsSecretArn: string;
  averageLatencyMs: number;
  uptimePercentage: number;
  supportedServices: string[];
}

export interface ApiKeyRecord {
  id: string;
  providerId: string;
  providerName: string;
  keyLabel: string;
  keyType: "secret_key" | "publishable_key" | "webhook_secret" | "client_id";
  environment: ApiEnvironment;
  maskedKey: string;
  kmsArnRef: string;
  lastRotated: string;
  status: "active" | "revoked" | "expired";
}

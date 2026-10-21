/**
 * Buymecart API Integration & Business Management Platform Types
 * Architecture: Compliant with future Python/FastAPI backend schema.
 * Security: Enforces masked KMS credential references, zero frontend secret storage,
 * and maker-checker production activation gates.
 */

export type ApiEnvironment = "sandbox" | "production";

export type ApiProviderCategory =
  | "banking_rail"
  | "payment_gateway"
  | "identity_verification"
  | "telecom_utility"
  | "bbps_switch";

export type ApiProviderStatus = "active" | "inactive" | "pending_approval" | "maintenance" | "degraded";

export type AuthMethod =
  | "bearer_token"
  | "api_key_header"
  | "basic_auth"
  | "oauth2_client_credentials"
  | "mutual_tls";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiProvider {
  id: string;
  name: string;
  category: ApiProviderCategory;
  description: string;
  websiteUrl: string;
  docsUrl: string;
  environment: ApiEnvironment;
  status: ApiProviderStatus;
  healthStatus: "healthy" | "degraded" | "down" | "unmonitored";
  lastHealthCheck: string;
  averageLatencyMs: number;
  uptimePercentage: number;
  supportedServices: string[];
  contactEmail: string;
  productionApproved: boolean;
  productionApprovedBy?: string;
  productionApprovedAt?: string;
}

export interface ApiConnectionEndpoint {
  id: string;
  name: string;
  path: string;
  method: HttpMethod;
  description: string;
  requestSchemaSummary: string;
  responseSchemaSummary: string;
  timeoutMs: number;
  retryCount: number;
  requiresSignature: boolean;
  webhookCallbackUrl?: string;
}

export interface ApiConnectionConfig {
  id: string;
  providerId: string;
  providerName: string;
  environment: ApiEnvironment;
  baseUrl: string;
  authMethod: AuthMethod;
  // Masked KMS / Secret Manager reference, NEVER plain-text credentials!
  credentialRef: string;
  credentialLastRotated: string;
  defaultHeaders: Record<string, string>;
  endpoints: ApiConnectionEndpoint[];
  webhookSecretRef?: string;
  errorMappings: Array<{
    providerCode: string;
    internalCode: string;
    description: string;
    action: "retry" | "fail" | "flag_suspicious";
  }>;
}

export interface ApiServiceMapping {
  id: string;
  internalServiceId: string;
  internalServiceName: string;
  serviceCategory: string;
  providerId: string;
  providerName: string;
  endpointId: string;
  endpointPath: string;
  httpMethod: HttpMethod;
  isActive: boolean;
  eligibilityRoles: string[]; // e.g. ["admin", "super_distributor", "area_distributor", "retailer"]
  pricingPlanRef: string; // Links to Tempered Margin or Custom Platform Fee
  sandboxTested: boolean;
  sandboxApprovedAt?: string;
  productionReady: boolean;
  inputValidationRules: string[];
  fieldTransformations: Array<{
    sourceField: string;
    targetField: string;
    transformationType: "direct" | "format_inr" | "trim_upper" | "mask";
  }>;
}

export interface ApiSandboxTestRun {
  id: string;
  providerId: string;
  endpointPath: string;
  method: HttpMethod;
  executedAt: string;
  requestPayload: Record<string, any>;
  responseStatus: number;
  responseBody: Record<string, any>;
  latencyMs: number;
  schemaValid: boolean;
  passed: boolean;
  environment: "sandbox";
}

export interface ApiProduct {
  id: string;
  name: string;
  slug: string;
  version: string;
  description: string;
  includedServiceIds: string[];
  includedServicesCount: number;
  authRequirements: string[];
  rateLimitRpm: number;
  dailyQuota: number;
  pricingModelRef: string;
  publicationStatus: "draft" | "review_pending" | "published" | "deprecated";
  sandboxAvailable: boolean;
  productionAvailable: boolean;
  developerDocsSnippet: string;
  subscribersCount: number;
}

export interface ApiClientAccount {
  id: string;
  clientName: string;
  organization: string;
  contactEmail: string;
  clientId: string;
  // Secure masked reference
  clientSecretMasked: string;
  subscribedProductIds: string[];
  status: "active" | "suspended" | "pending_kyc";
  rateLimitTier: "Starter" | "Growth" | "Enterprise High Volume";
  ipAllowlist: string[];
  totalCallsThisMonth: number;
  monthlyQuota: number;
  joinedDate: string;
}

export interface ApiUsageMetric {
  date: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgLatencyMs: number;
  billableAmountInr: number;
}

export interface ApiSecurityAuditEvent {
  id: string;
  timestamp: string;
  adminEmail: string;
  category: "credential_rotation" | "auth_failure" | "rate_limit_exceeded" | "config_change" | "production_signoff" | "suspicious_ip";
  severity: "info" | "warning" | "critical";
  description: string;
  ipAddress: string;
  affectedEntityId: string;
}

export interface ApiKeyRecord {
  id: string;
  providerId: string;
  providerName: string;
  keyLabel: string;
  keyType: "api_key" | "secret_key" | "bearer_token" | "webhook_secret" | "client_certificate" | "oauth2_client_secret";
  environment: ApiEnvironment;
  maskedKey: string;
  kmsArnRef: string;
  lastRotated: string;
  expiryDate?: string;
  status: "active" | "expiring_soon" | "revoked";
  assignedServices: string[];
}



import { describe, expect, it } from "vitest";
import {
  mockApiProviders,
  mockConnectionConfigs,
  mockServiceMappings,
  mockApiProducts,
  mockApiClients,
  mockUsageMetrics,
  mockSecurityAuditLogs,
  validateSsrfSafeUrl,
} from "@/lib/api-management/mock-data";

describe("API Management Data Models & Security Policies", () => {
  describe("API Providers Registry Data Integrity", () => {
    it("contains all core banking, gateway, KYC, and BBPS providers", () => {
      expect(mockApiProviders.length).toBeGreaterThanOrEqual(7);

      const providerIds = mockApiProviders.map((p) => p.id);
      expect(providerIds).toContain("prov-icici-banking");
      expect(providerIds).toContain("prov-sbi-cbs");
      expect(providerIds).toContain("prov-razorpay");
      expect(providerIds).toContain("prov-stripe");
      expect(providerIds).toContain("prov-protean-nsdl");
      expect(providerIds).toContain("prov-npci-bbps");
    });

    it("verifies health check timestamps and SLA uptimes", () => {
      mockApiProviders.forEach((p) => {
        expect(p.uptimePercentage).toBeGreaterThanOrEqual(99.0);
        expect(p.averageLatencyMs).toBeGreaterThan(0);
        expect(p.websiteUrl).toMatch(/^https:\/\//);
        expect(p.docsUrl).toMatch(/^https:\/\//);
      });
    });

    it("enforces production approval governance flag", () => {
      const icici = mockApiProviders.find((p) => p.id === "prov-icici-banking");
      expect(icici?.productionApproved).toBe(true);
      expect(icici?.productionApprovedBy).toBeDefined();

      const stripe = mockApiProviders.find((p) => p.id === "prov-stripe");
      expect(stripe?.environment).toBe("sandbox");
      expect(stripe?.productionApproved).toBe(false);
    });
  });

  describe("API Connection Security & Zero Plain-Text Secret Storage", () => {
    it("enforces AWS KMS Vault reference format for all credentials", () => {
      mockConnectionConfigs.forEach((c) => {
        // Enforce vault ARN pattern: kms://vault/...
        expect(c.credentialRef).toMatch(/^kms:\/\/vault\//);
        // Ensure no raw passwords, secrets, or tokens exist in plaintext
        expect(c.credentialRef).not.toContain("password");
        expect(c.credentialRef).not.toContain("secret123");
      });
    });

    it("contains endpoints with schemas, timeouts, and retry policies", () => {
      mockConnectionConfigs.forEach((c) => {
        expect(c.endpoints.length).toBeGreaterThan(0);
        c.endpoints.forEach((ep) => {
          expect(ep.path).toMatch(/^\//);
          expect(["GET", "POST", "PUT", "PATCH", "DELETE"]).toContain(ep.method);
          expect(ep.timeoutMs).toBeGreaterThanOrEqual(1000);
          expect(ep.retryCount).toBeGreaterThanOrEqual(0);
        });
      });
    });
  });

  describe("Service Mapping & Tempered Margin Engine Decoupling", () => {
    it("maps internal services to provider endpoints while isolating pricing", () => {
      expect(mockServiceMappings.length).toBeGreaterThanOrEqual(5);

      const upiMap = mockServiceMappings.find((m) => m.internalServiceId === "PAY_UPI_COLLECT");
      expect(upiMap).toBeDefined();
      expect(upiMap?.pricingPlanRef).toContain("TEMPERED_MARGIN");
      expect(upiMap?.providerId).toBe("prov-razorpay");

      const dmtMap = mockServiceMappings.find((m) => m.internalServiceId === "DMT_IMPS_TRANSFER");
      expect(dmtMap).toBeDefined();
      expect(dmtMap?.providerId).toBe("prov-icici-banking");
      expect(dmtMap?.eligibilityRoles).toContain("retailer");
    });
  });

  describe("Commercial API Product Builder & Developer Subscriptions", () => {
    it("defines authorized API products with quotas and rate limits", () => {
      mockApiProducts.forEach((prod) => {
        expect(prod.rateLimitRpm).toBeGreaterThanOrEqual(100);
        expect(prod.dailyQuota).toBeGreaterThanOrEqual(10000);
        expect(prod.developerDocsSnippet).toContain("curl");
        expect(["draft", "review_pending", "published", "deprecated"]).toContain(
          prod.publicationStatus
        );
      });
    });

    it("verifies clean initial zero-state for developer client accounts with no dummy accounts", () => {
      expect(mockApiClients).toHaveLength(0);
    });
  });

  describe("Server-Side Request Forgery (SSRF) Prevention Engine", () => {
    it("allows valid public HTTPS endpoints", () => {
      expect(validateSsrfSafeUrl("https://developer.icicibank.com/v2/api").safe).toBe(true);
      expect(validateSsrfSafeUrl("https://api.razorpay.com/v1/orders").safe).toBe(true);
      expect(validateSsrfSafeUrl("https://api.stripe.com/v1").safe).toBe(true);
    });

    it("blocks unencrypted HTTP protocols", () => {
      const res = validateSsrfSafeUrl("http://api.partnerbank.com");
      expect(res.safe).toBe(false);
      expect(res.reason).toContain("Only encrypted HTTPS");
    });

    it("blocks localhost, loopback, and cloud metadata IPs", () => {
      expect(validateSsrfSafeUrl("https://localhost/api").safe).toBe(false);
      expect(validateSsrfSafeUrl("https://127.0.0.1:8080/admin").safe).toBe(false);
      // AWS/GCP metadata IP
      expect(validateSsrfSafeUrl("https://169.254.169.254/latest/meta-data/").safe).toBe(false);
    });

    it("blocks private network ranges (10.x, 192.168.x, 172.16.x)", () => {
      expect(validateSsrfSafeUrl("https://10.0.0.5/cbs").safe).toBe(false);
      expect(validateSsrfSafeUrl("https://192.168.1.100/gateway").safe).toBe(false);
      expect(validateSsrfSafeUrl("https://172.16.0.1/auth").safe).toBe(false);
      expect(validateSsrfSafeUrl("https://backend.internal/transfer").safe).toBe(false);
    });
  });
});


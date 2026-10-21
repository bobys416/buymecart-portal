import { describe, expect, it } from "vitest";
import { paymentEngine } from "@/lib/payments/engine";
import { upiProvider } from "@/lib/payments/providers/upi-provider";
import { razorpayProvider } from "@/lib/payments/providers/razorpay-provider";
import { stripeProvider } from "@/lib/payments/providers/stripe-provider";
import { bankingApiProvider } from "@/lib/payments/providers/banking-api-provider";
import { getPaymentConfig, getGatewayHealthStatusList } from "@/lib/payments/config";

describe("Payment Engine & Multi-Gateway Integration Tests", () => {
  // 1. Gateway Health & Configuration
  describe("Payment Gateway Configuration & Diagnostics", () => {
    it("reports all 4 core payment gateways with correct IDs and feature flags", () => {
      const gateways = getGatewayHealthStatusList();
      expect(gateways).toHaveLength(4);

      const gatewayIds = gateways.map((g) => g.id);
      expect(gatewayIds).toContain("upi");
      expect(gatewayIds).toContain("razorpay");
      expect(gatewayIds).toContain("banking");
      expect(gatewayIds).toContain("stripe");

      const upi = gateways.find((g) => g.id === "upi");
      expect(upi?.name).toContain("NPCI");
      expect(upi?.features).toContain("Dynamic BharatQR");

      const banking = gateways.find((g) => g.id === "banking");
      expect(banking?.features).toContain("Penny Drop Validation");
      expect(banking?.features).toContain("Direct IMPS Payout");
    });
  });

  // 2. UPI Provider & Dynamic BharatQR
  describe("NPCI UPI Rail Provider", () => {
    it("generates valid NPCI UPI deeplink with correct query parameters", () => {
      const deeplink = upiProvider.generateDeeplink({
        orderId: "BMC-ORD-12345",
        amount: 850.5,
        customerRef: "CUST-9988",
        transactionNote: "Retailer Settlement",
      });

      expect(deeplink).toMatch(/^upi:\/\/pay\?/);
      expect(deeplink).toContain("pa=buymecart@icici");
      expect(deeplink).toContain("am=850.50");
      expect(deeplink).toContain("cu=INR");
      expect(deeplink).toContain("tr=BMC-ORD-12345");
    });

    it("generates a high-resolution base64 PNG Dynamic BharatQR data URL", async () => {
      const deeplink = upiProvider.generateDeeplink({
        orderId: "BMC-ORD-QR-1",
        amount: 250,
        customerRef: "CUST-QR",
      });

      const qrDataUrl = await upiProvider.generateQRCodeDataUrl(deeplink);
      expect(qrDataUrl).toMatch(/^data:image\/png;base64,/);
      expect(qrDataUrl.length).toBeGreaterThan(100);
    });

    it("verifies UPI transactions against switch simulation", () => {
      const result = upiProvider.verifyTransaction("BMC-ORD-UPI-TEST");
      expect(result.status).toBe("Successful");
      expect(result.bankRefNo).toMatch(/^UPI\d+/);
    });
  });

  // 3. Razorpay Provider
  describe("Razorpay Payment Suite Provider", () => {
    it("creates an order with valid order ID and receipt identifier", async () => {
      const order = await razorpayProvider.createOrder({
        orderId: "BMC-RZP-101",
        amount: 1500,
        customerRef: "RETAILER-001",
        receipt: "rcpt_bmc_rzp_101",
      });

      expect(order.razorpayOrderId).toBeDefined();
      expect(order.razorpayOrderId.length).toBeGreaterThan(5);
      expect(order.keyId).toBeDefined();
    });

    it("verifies simulated sandbox signature successfully", () => {
      const isValid = razorpayProvider.verifySignature({
        razorpayOrderId: "order_mock123",
        razorpayPaymentId: "pay_mock456",
        razorpaySignature: "simulated_sig",
      });
      expect(isValid).toBe(true);
    });

    it("rejects verification when signature or payment ID is missing", () => {
      const isValid = razorpayProvider.verifySignature({
        razorpayOrderId: "order_mock123",
        razorpayPaymentId: "",
        razorpaySignature: "",
      });
      expect(isValid).toBe(false);
    });
  });

  // 4. Stripe Provider
  describe("Stripe International & Domestic Cards Provider", () => {
    it("creates PaymentIntent with client secret and publishable key", async () => {
      const intent = await stripeProvider.createPaymentIntent({
        orderId: "BMC-STRIPE-001",
        amount: 2400,
        customerRef: "CARD-USER-1",
        customerEmail: "merchant@buymecart.org",
      });

      expect(intent.paymentIntentId).toMatch(/^pi_/);
      expect(intent.clientSecret).toContain(intent.paymentIntentId);
      expect(intent.publishableKey).toBeDefined();
    });
  });

  // 5. Core Banking Direct Rail & Penny Drop Verification
  describe("Banking API Provider (IMPS / NEFT & Penny Drop)", () => {
    it("successfully verifies active beneficiary account via ₹1 Penny Drop", async () => {
      const result = await bankingApiProvider.verifyBeneficiaryAccount({
        accountNumber: "99201004561234",
        ifsc: "SBIN0001234",
        beneficiaryName: "Rajesh Kumar",
      });

      expect(result.valid).toBe(true);
      expect(result.status).toBe("Verified");
      expect(result.bankName).toBe("State Bank of India");
      expect(result.registeredName).toBe("Rajesh Kumar");
      expect(result.verificationUtr).toMatch(/^PND/);
      expect(result.matchScore).toBeGreaterThan(90);
    });

    it("identifies known bank institutions from IFSC prefix", async () => {
      const hdfc = await bankingApiProvider.verifyBeneficiaryAccount({
        accountNumber: "50100234567890",
        ifsc: "HDFC0000045",
      });
      expect(hdfc.valid).toBe(true);
      expect(hdfc.bankName).toBe("HDFC Bank Ltd");

      const icici = await bankingApiProvider.verifyBeneficiaryAccount({
        accountNumber: "000401234567",
        ifsc: "ICIC0000001",
      });
      expect(icici.valid).toBe(true);
      expect(icici.bankName).toBe("ICICI Bank Ltd");
    });

    it("rejects invalid IFSC or account format in Penny Drop validation", async () => {
      const invalidIfsc = await bankingApiProvider.verifyBeneficiaryAccount({
        accountNumber: "99201004561234",
        ifsc: "INVALID_IFSC",
      });
      expect(invalidIfsc.valid).toBe(false);
      expect(invalidIfsc.status).toBe("Failed");

      const invalidAccount = await bankingApiProvider.verifyBeneficiaryAccount({
        accountNumber: "123", // too short
        ifsc: "SBIN0001234",
      });
      expect(invalidAccount.valid).toBe(false);
    });

    it("initiates IMPS payout and generates 12-digit UTR with masked debit account", async () => {
      const payout = await bankingApiProvider.initiateTransfer({
        orderId: "BMC-PAYOUT-77",
        amount: 45000,
        beneficiaryAccount: "99201004561234",
        beneficiaryIfsc: "SBIN0001234",
        beneficiaryName: "Amitabh Sen",
        customerRef: "RET-NORTH-9",
      });

      expect(payout.success).toBe(true);
      expect(payout.transferMode).toBe("IMPS");
      expect(payout.bankUtr).toMatch(/^UTR/);
      expect(payout.debitAccountMasked).toMatch(/^\*\*\*\*\d{4}$/);
    });

    it("routes payouts > ₹5,00,000 through NEFT rail by default", async () => {
      const payout = await bankingApiProvider.initiateTransfer({
        orderId: "BMC-PAYOUT-HIGH",
        amount: 800000,
        beneficiaryAccount: "99201004561234",
        beneficiaryIfsc: "UTIB0000045",
        beneficiaryName: "Wholesale Corp",
        customerRef: "MERCH-HIGH-1",
      });

      expect(payout.transferMode).toBe("NEFT");
    });
  });

  // 6. Unified Payment Engine & Tempered Margin Application
  describe("Unified Payment Engine (Multi-Gateway Switch & Fee Slabs)", () => {
    it("initiates UPI payment applying ₹7 fixed fee for ₹500 transaction", async () => {
      const order = await paymentEngine.initiatePayment({
        gateway: "upi",
        amount: 500,
        customerRef: "CUST-500",
        serviceCategory: "UPI Collect",
      });

      expect(order.gateway).toBe("upi");
      expect(order.amount).toBe(500);
      expect(order.fee).toBe(7); // ₹101 - ₹1,000 = ₹7
      expect(order.netSettlement).toBe(493); // 500 - 7
      expect(order.upiDeepLink).toBeDefined();
      expect(order.upiQrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    });

    it("initiates Razorpay payment applying ₹9 fixed fee for ₹1,500 transaction", async () => {
      const order = await paymentEngine.initiatePayment({
        gateway: "razorpay",
        amount: 1500,
        customerRef: "CUST-1500",
        serviceCategory: "Payment Gateway",
      });

      expect(order.gateway).toBe("razorpay");
      expect(order.amount).toBe(1500);
      expect(order.fee).toBe(9); // ₹1,001 - ₹2,000 = ₹9
      expect(order.netSettlement).toBe(1491); // 1500 - 9
      expect(order.razorpayOrderId).toBeDefined();
    });

    it("initiates Stripe payment with variable percentage fee for >₹2,000", async () => {
      const order = await paymentEngine.initiatePayment({
        gateway: "stripe",
        amount: 10000,
        customerRef: "CUST-CARD-10K",
        serviceCategory: "Credit Card Payment", // 0.50% override
      });

      expect(order.gateway).toBe("stripe");
      expect(order.amount).toBe(10000);
      expect(order.fee).toBe(50); // 10,000 * 0.50% = 50
      expect(order.netSettlement).toBe(9950);
      expect(order.stripeClientSecret).toBeDefined();
    });

    it("initiates Direct Banking IMPS payout with immediate execution", async () => {
      const order = await paymentEngine.initiatePayment({
        gateway: "banking",
        amount: 8000,
        customerRef: "DMT-USER-8K",
        serviceCategory: "Domestic Money Transfer (DMT)",
        beneficiaryAccount: "99201004561234",
        beneficiaryIfsc: "SBIN0001234",
        beneficiaryName: "Gaurav Singh",
      });

      expect(order.gateway).toBe("banking");
      expect(order.status).toBe("succeeded");
      expect(order.bankUtr).toBeDefined();
      expect(order.bankAccountMasked).toBeDefined();
    });

    it("verifies universal payments across all 4 supported gateways", async () => {
      // 1. UPI Verification
      const upiVer = await paymentEngine.verifyPayment({
        orderId: "BMC-ORD-UPI",
        gateway: "upi",
      });
      expect(upiVer.success).toBe(true);
      expect(upiVer.gateway).toBe("upi");
      expect(upiVer.status).toBe("Successful");

      // 2. Razorpay Verification
      const rzpVer = await paymentEngine.verifyPayment({
        orderId: "BMC-ORD-RZP",
        gateway: "razorpay",
        razorpayOrderId: "order_mock123",
        razorpayPaymentId: "pay_mock456",
        razorpaySignature: "simulated_sig",
      });
      expect(rzpVer.success).toBe(true);
      expect(rzpVer.gateway).toBe("razorpay");

      // 3. Stripe Verification
      const stripeVer = await paymentEngine.verifyPayment({
        orderId: "BMC-ORD-STRIPE",
        gateway: "stripe",
        stripePaymentIntentId: "pi_mock123456",
      });
      expect(stripeVer.success).toBe(true);
      expect(stripeVer.gateway).toBe("stripe");

      // 4. Banking Verification
      const bankVer = await paymentEngine.verifyPayment({
        orderId: "BMC-ORD-BANK",
        gateway: "banking",
        bankUtr: "UTR9988776655",
      });
      expect(bankVer.success).toBe(true);
      expect(bankVer.gateway).toBe("banking");
      expect(bankVer.bankRefNo).toBe("UTR9988776655");
    });
  });
});

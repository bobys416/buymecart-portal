import { describe, expect, it } from "vitest";
import {
  calculateTemperedMargin,
  calculateCartTotals,
  formatINR,
  validateUPIVpa,
  validateIFSC,
  validateAccountNumber,
  validateIndianMobile,
  generateNeutralReceipt,
} from "../packages/business-logic";
import {
  loginSchema,
  registerSchema,
  dmtTransferSchema,
  aepsWithdrawalSchema,
  makerCheckerSignoffSchema,
  upiPaySchema,
} from "../packages/validation";
import { UnifiedApiClient } from "../packages/api-client";
import { FinancialTransaction } from "../packages/shared-types";
import { colors, designTokens } from "../packages/design-tokens";

describe("BuyMeCart Shared Packages Suite", () => {
  describe("Business Logic & Statutory Rules (PDF Page 3)", () => {
    it("calculates DMT Tempered Margin fee and statutory levy accurately", () => {
      // For ₹5,000 DMT: slab is 1001-25000: fixedFee ₹10, percentage 0.45%
      // 5000 * 0.0045 = 22.5. Raw fee = 10 + 22.5 = 32.50
      // 18% GST on 32.50 = 5.85. Total debit = 5000 + 32.50 + 5.85 = 5038.35
      const calc = calculateTemperedMargin(5000, "dmt");
      expect(calc.baseAmount).toBe(5000);
      expect(calc.serviceFee).toBe(32.5);
      expect(calc.statutoryLevy).toBe(5.85);
      expect(calc.totalCustomerDebit).toBe(5038.35);
      expect(calc.retailerCommission).toBeGreaterThan(0);
      expect(calc.distributorCommission).toBeGreaterThan(0);
      expect(calc.platformNetMargin).toBeGreaterThan(0);
    });

    it("calculates AEPS Cash Withdrawal slab tiers correctly", () => {
      const slab1 = calculateTemperedMargin(800, "aeps");
      expect(slab1.serviceFee).toBe(2.0);

      const slab2 = calculateTemperedMargin(2500, "aeps");
      expect(slab2.serviceFee).toBe(6.0);

      const slab3 = calculateTemperedMargin(5000, "aeps");
      expect(slab3.serviceFee).toBe(10.0);
    });

    it("handles zero or negative amounts gracefully", () => {
      const zero = calculateTemperedMargin(0, "dmt");
      expect(zero.serviceFee).toBe(0);
      expect(zero.totalCustomerDebit).toBe(0);
    });

    it("calculates e-commerce cart totals with Tempered Margin fee", () => {
      const items = [
        {
          product: {
            id: "p1",
            sku: "POS-01",
            name: "Micro-ATM Terminal",
            description: "Biometric POS",
            category: "pos_hardware" as const,
            price: 2500,
            currency: "INR" as const,
            stock: 10,
            images: [],
            ratings: 4.8,
            ratingCount: 12,
            isAvailable: true,
          },
          quantity: 2,
        },
      ];

      const totals = calculateCartTotals(items, true);
      expect(totals.subtotal).toBe(5000);
      expect(totals.itemCount).toBe(2);
      // 0.5% of 5000 = 25
      expect(totals.temperedMarginFee).toBe(25);
      expect(totals.shippingFee).toBe(0); // Cart > 500 has free shipping
      expect(totals.grandTotal).toBe(5275); // 5000 + 25 + 250 (5% tax)
    });

    it("formats Indian Rupee correctly with commas and symbol", () => {
      expect(formatINR(125000.5)).toContain("1,25,000.50");
      expect(formatINR(0)).toContain("0.00");
    });

    it("validates financial formats (UPI VPA, IFSC, Account Number, Mobile)", () => {
      expect(validateUPIVpa("merchant@upi")).toBe(true);
      expect(validateUPIVpa("invalid_vpa")).toBe(false);

      expect(validateIFSC("SBIN0001234")).toBe(true);
      expect(validateIFSC("ICIC0000001")).toBe(true);
      expect(validateIFSC("INVALID123")).toBe(false);

      expect(validateAccountNumber("123456789012")).toBe(true);
      expect(validateAccountNumber("123")).toBe(false);

      expect(validateIndianMobile("9876543210")).toBe(true);
      expect(validateIndianMobile("1234567890")).toBe(false);
    });

    it("generates Note 1 compliant neutral receipt without third-party bank logos", () => {
      const tx: FinancialTransaction = {
        id: "tx-test-01",
        transactionRef: "BMC-DMT-998822",
        rrn: "412345678901",
        serviceType: "dmt",
        retailerId: "RET-101",
        retailerName: "Sharma Digital Kendra",
        customerIdentifier: "+91 98765 43210",
        amount: 2500,
        temperedMarginFee: 21.25,
        commissionEarned: 12.75,
        netDebit: 2525.07,
        status: "success",
        upstreamSwitch: "ICICI IMPS Direct Switch",
        latencyMs: 120,
        createdAt: "2026-10-19T10:00:00Z",
      };

      const receipt = generateNeutralReceipt(tx, "RT-BHOPAL-01");
      expect(receipt.neutralWatermark).toBe("BUYMECART_IBNK_NEUTRAL_RECEIPT_V1");
      expect(receipt.transactionRef).toBe(tx.transactionRef);
      expect(receipt.rrn).toBe(tx.rrn);
      expect(receipt.totalPaid).toBeGreaterThan(tx.amount);
      expect(receipt.qrPayload).toContain("BUYMECART|BMC-DMT-998822");
    });
  });

  describe("Validation Schemas (Zod)", () => {
    it("validates login with either email or 10-digit mobile", () => {
      const emailLogin = loginSchema.safeParse({
        identifier: "admin@buymecart.org",
        password: "securePassword123",
      });
      expect(emailLogin.success).toBe(true);

      const mobileLogin = loginSchema.safeParse({
        identifier: "9876543210",
        password: "securePassword123",
      });
      expect(mobileLogin.success).toBe(true);

      const invalidLogin = loginSchema.safeParse({
        identifier: "abc",
        password: "123",
      });
      expect(invalidLogin.success).toBe(false);
    });

    it("validates DMT transfer schema correctly", () => {
      const validDmt = dmtTransferSchema.safeParse({
        recipientName: "Rajesh Kumar",
        accountNumber: "123456789012",
        confirmAccountNumber: "123456789012",
        ifsc: "SBIN0001234",
        amount: 5000,
        transferMode: "IMPS",
      });
      expect(validDmt.success).toBe(true);

      const mismatchDmt = dmtTransferSchema.safeParse({
        recipientName: "Rajesh Kumar",
        accountNumber: "123456789012",
        confirmAccountNumber: "999999999999",
        ifsc: "SBIN0001234",
        amount: 5000,
        transferMode: "IMPS",
      });
      expect(mismatchDmt.success).toBe(false);
    });

    it("validates Maker-Checker signoff requirement for mandatory justification", () => {
      const validSignoff = makerCheckerSignoffSchema.safeParse({
        approvalId: "app-101",
        action: "APPROVE",
        auditJustification: "Verified risk score 18, verified upstream switch latency ok.",
        otpConfirmation: "123456",
      });
      expect(validSignoff.success).toBe(true);

      const tooShortSignoff = makerCheckerSignoffSchema.safeParse({
        approvalId: "app-101",
        action: "APPROVE",
        auditJustification: "ok", // Too short!
        otpConfirmation: "123456",
      });
      expect(tooShortSignoff.success).toBe(false);
    });
  });

  describe("API Client & Offline Queue Mechanism", () => {
    it("handles offline requests and mutation queueing properly", async () => {
      let isOnline = false;
      const client = new UnifiedApiClient({
        baseUrl: "https://api.buymecart.org",
        isOnlineGetter: () => isOnline,
      });

      const offlinePost = await client.post(
        "/api/transactions",
        { amount: 1000 },
        true // allow offline queue
      );

      expect(offlinePost.ok).toBe(true);
      if (offlinePost.ok) {
        expect((offlinePost.data as { queuedForSync: boolean }).queuedForSync).toBe(true);
      }
    });
  });

  describe("Design Tokens", () => {
    it("exposes consistent primary navy and accent color palette", () => {
      expect(colors.navy.DEFAULT).toBe("#0B1530");
      expect(colors.teal.DEFAULT).toBe("#12C8B4");
      expect(colors.sky.DEFAULT).toBe("#0284C7");
      expect(colors.emerald.DEFAULT).toBe("#059669");
      expect(colors.rose.DEFAULT).toBe("#E11D48");
      expect(designTokens.spacing[4]).toBe(16);
      expect(designTokens.borderRadius.lg).toBe(12);
    });
  });
});

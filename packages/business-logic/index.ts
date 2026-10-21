/**
 * BuyMeCart + IBNK Multi-Platform Unified Ecosystem
 * Shared Reusable Business Logic & Statutory Calculations
 */

import {
  CartItem,
  FinancialTransaction,
  IbnkServiceType,
  NeutralReceipt,
  TemperedMarginCalculation,
  TemperedMarginSchedule,
} from "../shared-types";

// ==========================================
// 1. STATUTORY TEMPERED MARGIN SCHEDULES (PDF Page 3)
// ==========================================

export const TEMPERED_MARGIN_SCHEDULES: Record<IbnkServiceType, TemperedMarginSchedule[]> = {
  dmt: [
    {
      service: "dmt",
      minAmount: 100,
      maxAmount: 1000,
      fixedFee: 5.0,
      percentageFee: 0.0035, // 0.35%
      statutoryLevyPct: 0.18, // 18% GST
      retailerCommissionSharePct: 0.60,
      distributorCommissionSharePct: 0.25,
    },
    {
      service: "dmt",
      minAmount: 1001,
      maxAmount: 25000,
      fixedFee: 10.0,
      percentageFee: 0.0045, // 0.45%
      statutoryLevyPct: 0.18,
      retailerCommissionSharePct: 0.60,
      distributorCommissionSharePct: 0.25,
    },
    {
      service: "dmt",
      minAmount: 25001,
      maxAmount: 200000,
      fixedFee: 25.0,
      percentageFee: 0.0055, // 0.55%
      statutoryLevyPct: 0.18,
      retailerCommissionSharePct: 0.65,
      distributorCommissionSharePct: 0.20,
    },
  ],
  aeps: [
    {
      service: "aeps",
      minAmount: 100,
      maxAmount: 1000,
      fixedFee: 2.0,
      percentageFee: 0,
      statutoryLevyPct: 0.18,
      retailerCommissionSharePct: 0.70,
      distributorCommissionSharePct: 0.20,
    },
    {
      service: "aeps",
      minAmount: 1001,
      maxAmount: 3000,
      fixedFee: 6.0,
      percentageFee: 0,
      statutoryLevyPct: 0.18,
      retailerCommissionSharePct: 0.70,
      distributorCommissionSharePct: 0.20,
    },
    {
      service: "aeps",
      minAmount: 3001,
      maxAmount: 10000,
      fixedFee: 10.0,
      percentageFee: 0,
      statutoryLevyPct: 0.18,
      retailerCommissionSharePct: 0.75,
      distributorCommissionSharePct: 0.15,
    },
  ],
  micro_atm: [
    {
      service: "micro_atm",
      minAmount: 100,
      maxAmount: 1000,
      fixedFee: 2.5,
      percentageFee: 0,
      statutoryLevyPct: 0.18,
      retailerCommissionSharePct: 0.70,
      distributorCommissionSharePct: 0.20,
    },
    {
      service: "micro_atm",
      minAmount: 1001,
      maxAmount: 3000,
      fixedFee: 6.5,
      percentageFee: 0,
      statutoryLevyPct: 0.18,
      retailerCommissionSharePct: 0.70,
      distributorCommissionSharePct: 0.20,
    },
    {
      service: "micro_atm",
      minAmount: 3001,
      maxAmount: 10000,
      fixedFee: 11.0,
      percentageFee: 0,
      statutoryLevyPct: 0.18,
      retailerCommissionSharePct: 0.75,
      distributorCommissionSharePct: 0.15,
    },
  ],
  bbps: [
    {
      service: "bbps",
      minAmount: 10,
      maxAmount: 500000,
      fixedFee: 3.5,
      percentageFee: 0.001, // 0.10%
      statutoryLevyPct: 0.18,
      retailerCommissionSharePct: 0.65,
      distributorCommissionSharePct: 0.20,
    },
  ],
  upi_switch: [
    {
      service: "upi_switch",
      minAmount: 1,
      maxAmount: 2000,
      fixedFee: 0.0,
      percentageFee: 0.0, // Free tier
      statutoryLevyPct: 0.18,
      retailerCommissionSharePct: 0.50,
      distributorCommissionSharePct: 0.25,
    },
    {
      service: "upi_switch",
      minAmount: 2001,
      maxAmount: 100000,
      fixedFee: 1.0,
      percentageFee: 0.0015, // 0.15%
      statutoryLevyPct: 0.18,
      retailerCommissionSharePct: 0.55,
      distributorCommissionSharePct: 0.25,
    },
  ],
};

/**
 * Calculates statutory Tempered Margin breakdown according to PDF Page 3 guidelines.
 */
export function calculateTemperedMargin(
  amount: number,
  service: IbnkServiceType = "dmt"
): TemperedMarginCalculation {
  if (amount <= 0) {
    return {
      baseAmount: 0,
      serviceFee: 0,
      statutoryLevy: 0,
      totalCustomerDebit: 0,
      retailerCommission: 0,
      distributorCommission: 0,
      platformNetMargin: 0,
    };
  }

  const slabs = TEMPERED_MARGIN_SCHEDULES[service] || TEMPERED_MARGIN_SCHEDULES.dmt;
  const matchedSlab =
    slabs.find((s) => amount >= s.minAmount && amount <= s.maxAmount) ||
    slabs[slabs.length - 1];

  const rawFee = matchedSlab.fixedFee + amount * matchedSlab.percentageFee;
  const statutoryLevy = Number((rawFee * matchedSlab.statutoryLevyPct).toFixed(2));
  const serviceFee = Number(rawFee.toFixed(2));
  const totalCustomerDebit = Number((amount + serviceFee + statutoryLevy).toFixed(2));

  // Commission shares computed from net service fee (excluding GST)
  const retailerCommission = Number(
    (serviceFee * matchedSlab.retailerCommissionSharePct).toFixed(2)
  );
  const distributorCommission = Number(
    (serviceFee * matchedSlab.distributorCommissionSharePct).toFixed(2)
  );
  const platformNetMargin = Number(
    (serviceFee - retailerCommission - distributorCommission).toFixed(2)
  );

  return {
    baseAmount: amount,
    serviceFee,
    statutoryLevy,
    totalCustomerDebit,
    retailerCommission,
    distributorCommission,
    platformNetMargin,
  };
}

// ==========================================
// 2. E-COMMERCE CART ENGINE
// ==========================================

export interface CartCalculationResult {
  subtotal: number;
  itemCount: number;
  temperedMarginFee: number;
  taxAmount: number;
  shippingFee: number;
  grandTotal: number;
}

export function calculateCartTotals(
  items: CartItem[],
  applyTemperedMargin: boolean = true
): CartCalculationResult {
  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // E-commerce Tempered Margin: 0.5% statutory convenience escrow, minimum ₹5
  const temperedMarginFee =
    applyTemperedMargin && subtotal > 0
      ? Number(Math.max(5, subtotal * 0.005).toFixed(2))
      : 0;

  // 18% GST on services / commodities standard
  const taxAmount = Number((subtotal * 0.05).toFixed(2));

  // Free shipping on cart > ₹500
  const shippingFee = subtotal > 500 || subtotal === 0 ? 0 : 49;

  const grandTotal = Number(
    (subtotal + temperedMarginFee + taxAmount + shippingFee).toFixed(2)
  );

  return {
    subtotal: Number(subtotal.toFixed(2)),
    itemCount,
    temperedMarginFee,
    taxAmount,
    shippingFee,
    grandTotal,
  };
}

// ==========================================
// 3. CURRENCY FORMATTING (INR)
// ==========================================

/**
 * Standard Indian Rupee format with ₹ symbol and Indian numbering separators.
 * e.g. 154200.50 -> ₹1,54,200.50
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// ==========================================
// 4. FINANCIAL VALIDATION HELPERS
// ==========================================

/**
 * Validates UPI Virtual Payment Address (e.g. username@okhdfcbank, name@upi)
 */
export function validateUPIVpa(vpa: string): boolean {
  if (!vpa || typeof vpa !== "string") return false;
  const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  return upiRegex.test(vpa.trim());
}

/**
 * Validates Indian Financial System Code (IFSC)
 * 11 characters: 4 letters, 0, 6 alphanumeric (e.g. SBIN0001234, ICIC0000001)
 */
export function validateIFSC(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  return ifscRegex.test(code.trim().toUpperCase());
}

/**
 * Validates Indian Bank Account Number (9 to 18 digits)
 */
export function validateAccountNumber(acc: string): boolean {
  if (!acc || typeof acc !== "string") return false;
  const accRegex = /^\d{9,18}$/;
  return accRegex.test(acc.trim());
}

/**
 * Validates Indian Mobile Phone Number (10 digits starting with 6, 7, 8, or 9)
 */
export function validateIndianMobile(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false;
  const cleaned = phone.replace(/\D/g, "");
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(cleaned.slice(-10));
}

// ==========================================
// 5. NEUTRAL RECEIPT COMPLIANCE GENERATOR
// Page 1 Note 1: Strict neutral receipt format with NO sponsor or third-party bank logos.
// ==========================================

export function generateNeutralReceipt(
  tx: FinancialTransaction,
  retailerCode: string = "RT-CENTRAL-01"
): NeutralReceipt {
  const calculation = calculateTemperedMargin(tx.amount, tx.serviceType);

  return {
    receiptNumber: `REC-${tx.transactionRef.slice(-8)}-${Date.now().toString().slice(-4)}`,
    transactionRef: tx.transactionRef,
    rrn: tx.rrn,
    serviceType: tx.serviceType,
    retailerName: tx.retailerName,
    retailerCode,
    customerIdentifier: tx.customerIdentifier,
    baseAmount: tx.amount,
    serviceFee: calculation.serviceFee,
    temperedMarginFee: calculation.platformNetMargin,
    totalPaid: calculation.totalCustomerDebit,
    status: tx.status,
    timestamp: tx.createdAt || new Date().toISOString(),
    qrPayload: `BUYMECART|${tx.transactionRef}|${tx.rrn}|${tx.amount}|${tx.status}`,
    neutralWatermark: "BUYMECART_IBNK_NEUTRAL_RECEIPT_V1",
  };
}

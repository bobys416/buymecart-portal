/**
 * BuyMeCart + IBNK Multi-Platform Unified Ecosystem
 * Shared Validation Schemas (Zod)
 */

import { z } from "zod";
import {
  validateAccountNumber,
  validateIFSC,
  validateIndianMobile,
  validateUPIVpa,
} from "../business-logic";

// ==========================================
// 1. AUTHENTICATION & IDENTITY SCHEMAS
// ==========================================

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(3, "Identifier must be at least 3 characters")
    .refine(
      (val) => val.includes("@") || validateIndianMobile(val),
      "Please enter a valid email or 10-digit mobile number"
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional().default(false),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .refine(validateIndianMobile, "Enter a valid 10-digit Indian mobile number"),
    role: z.enum(["customer", "retailer", "area_distributor", "super_distributor"]),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

// ==========================================
// 2. E-COMMERCE & CHECKOUT SCHEMAS
// ==========================================

export const shippingAddressSchema = z.object({
  fullName: z.string().min(2, "Contact name is required"),
  phone: z
    .string()
    .refine(validateIndianMobile, "Valid 10-digit phone number is required"),
  streetAddress: z.string().min(5, "Street address must be at least 5 characters"),
  locality: z.string().min(2, "Locality / Area is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, "Pincode must be exactly 6 digits starting with 1-9"),
  landmark: z.string().optional(),
});

export type ShippingAddressInput = z.infer<typeof shippingAddressSchema>;

export const checkoutOrderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().positive("Quantity must be at least 1"),
        unitPrice: z.number().positive(),
      })
    )
    .min(1, "Cart cannot be empty"),
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.enum([
    "upi",
    "card",
    "netbanking",
    "wallet",
    "cash_on_delivery",
    "ibnk_escrow",
  ]),
});

export type CheckoutOrderInput = z.infer<typeof checkoutOrderSchema>;

// ==========================================
// 3. IBNK FINANCIAL SERVICES SCHEMAS
// ==========================================

export const dmtTransferSchema = z.object({
  recipientName: z.string().min(2, "Beneficiary name required"),
  accountNumber: z
    .string()
    .refine(validateAccountNumber, "Bank account number must be 9-18 digits"),
  confirmAccountNumber: z.string(),
  ifsc: z
    .string()
    .refine(validateIFSC, "Invalid IFSC format (e.g. SBIN0001234)"),
  amount: z
    .number()
    .min(100, "Minimum transfer is ₹100")
    .max(200000, "Maximum single transfer is ₹2,00,000"),
  transferMode: z.enum(["IMPS", "NEFT", "RTGS"]).default("IMPS"),
  remarks: z.string().max(50, "Max 50 characters").optional(),
}).refine((data) => data.accountNumber === data.confirmAccountNumber, {
  message: "Bank account numbers do not match",
  path: ["confirmAccountNumber"],
});

export type DmtTransferInput = z.infer<typeof dmtTransferSchema>;

export const aepsWithdrawalSchema = z.object({
  aadhaarNumber: z
    .string()
    .regex(/^\d{12}$/, "Aadhaar must be exactly 12 digits"),
  bankIin: z.string().min(4, "Select bank"),
  amount: z
    .number()
    .min(100, "Minimum withdrawal is ₹100")
    .max(10000, "AEPS statutory cash limit is ₹10,000 per transaction"),
  biometricConsent: z.literal(true, {
    errorMap: () => ({ message: "Customer biometric consent is mandatory" }),
  }),
});

export type AepsWithdrawalInput = z.infer<typeof aepsWithdrawalSchema>;

export const upiPaySchema = z.object({
  vpa: z
    .string()
    .refine(validateUPIVpa, "Invalid UPI VPA address (e.g. merchant@upi)"),
  amount: z
    .number()
    .min(1, "Minimum payment is ₹1.00")
    .max(100000, "UPI statutory limit is ₹1,00,000"),
  note: z.string().max(40, "Max 40 characters").optional(),
});

export type UpiPayInput = z.infer<typeof upiPaySchema>;

export const disputeRequestSchema = z.object({
  transactionRef: z.string().min(5, "Valid transaction reference required"),
  reason: z.enum([
    "duplicate_debit",
    "account_not_credited",
    "terminal_timeout",
    "unauthorized",
  ]),
  customerPhone: z
    .string()
    .refine(validateIndianMobile, "Valid customer phone required"),
  claimAmount: z.number().positive("Claim amount must be positive"),
  disputeNotes: z
    .string()
    .min(10, "Please provide detailed context (min 10 characters)"),
});

export type DisputeRequestInput = z.infer<typeof disputeRequestSchema>;

// ==========================================
// 4. MAKER-CHECKER & PRIVILEGED ACTION SCHEMAS
// ==========================================

export const makerCheckerSignoffSchema = z.object({
  approvalId: z.string().min(1, "Approval ID is required"),
  action: z.enum(["APPROVE", "REJECT"]),
  auditJustification: z
    .string()
    .min(10, "Audit justification is strictly mandatory (min 10 characters)"),
  otpConfirmation: z
    .string()
    .length(6, "Dual-factor 6-digit verification code required"),
});

export type MakerCheckerSignoffInput = z.infer<typeof makerCheckerSignoffSchema>;

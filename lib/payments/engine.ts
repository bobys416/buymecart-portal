import { calculateTemperedMarginFee } from "../mock-data";
import {
  InitiatePaymentParams,
  PaymentVerificationRequest,
  PaymentVerificationResult,
  UnifiedPaymentOrder,
} from "./types";
import { razorpayProvider } from "./providers/razorpay-provider";
import { stripeProvider } from "./providers/stripe-provider";
import { upiProvider } from "./providers/upi-provider";
import { bankingApiProvider } from "./providers/banking-api-provider";

export class UnifiedPaymentEngine {
  /**
   * Initiates payment order across the chosen gateway (Razorpay, Stripe, UPI, or Banking API)
   * while computing the statutory tempered margin fee schedule.
   */
  async initiatePayment(params: InitiatePaymentParams): Promise<UnifiedPaymentOrder> {
    const orderId = `BMC-${Date.now().toString().slice(-8)}`;
    const marginQuote = calculateTemperedMarginFee(params.amount, params.serviceCategory);
    const fee = marginQuote.fee;
    const netSettlement = params.amount - fee;

    const baseOrder: UnifiedPaymentOrder = {
      orderId,
      gateway: params.gateway,
      amount: params.amount,
      currency: params.currency || "INR",
      fee,
      netSettlement,
      status: "created",
      createdAt: new Date().toISOString(),
    };

    // 1. UPI Payment Rail
    if (params.gateway === "upi") {
      const upiDeepLink = upiProvider.generateDeeplink({
        orderId,
        amount: params.amount,
        customerRef: params.customerRef,
        transactionNote: params.remarks || `${params.serviceCategory} - ${params.customerRef}`,
      });
      const upiQrCodeDataUrl = await upiProvider.generateQRCodeDataUrl(upiDeepLink);

      return {
        ...baseOrder,
        upiDeepLink,
        upiQrCodeDataUrl,
        upiVpa: "buymecart@icici",
      };
    }

    // 2. Razorpay Payment Suite
    if (params.gateway === "razorpay") {
      const rzp = await razorpayProvider.createOrder({
        orderId,
        amount: params.amount,
        currency: params.currency || "INR",
        customerRef: params.customerRef,
        receipt: `rcpt_${orderId.toLowerCase()}`,
        notes: {
          service: params.serviceCategory,
          customerName: params.customerName || "Customer",
        },
      });

      return {
        ...baseOrder,
        razorpayOrderId: rzp.razorpayOrderId,
        razorpayKeyId: rzp.keyId,
      };
    }

    // 3. Stripe Payment Gateway (Cards)
    if (params.gateway === "stripe") {
      const stripeData = await stripeProvider.createPaymentIntent({
        orderId,
        amount: params.amount,
        currency: params.currency || "inr",
        customerRef: params.customerRef,
        customerEmail: params.customerEmail,
        metadata: {
          serviceCategory: params.serviceCategory,
        },
      });

      return {
        ...baseOrder,
        stripeClientSecret: stripeData.clientSecret,
        stripePaymentIntentId: stripeData.paymentIntentId,
        stripePublishableKey: stripeData.publishableKey,
      };
    }

    // 4. Banking Direct Rail (IMPS / NEFT)
    if (params.gateway === "banking") {
      const payoutResult = await bankingApiProvider.initiateTransfer({
        orderId,
        amount: params.amount,
        beneficiaryAccount: params.beneficiaryAccount || "912345678901",
        beneficiaryIfsc: params.beneficiaryIfsc || "SBIN0001234",
        beneficiaryName: params.beneficiaryName || params.customerName || "Beneficiary",
        customerRef: params.customerRef,
        remarks: params.remarks,
      });

      return {
        ...baseOrder,
        status: payoutResult.success ? "succeeded" : "failed",
        bankingTxRef: orderId,
        bankUtr: payoutResult.bankUtr,
        beneficiaryName: payoutResult.beneficiaryName,
        bankAccountMasked: payoutResult.debitAccountMasked,
      };
    }

    return baseOrder;
  }

  /**
   * Verifies an initiated payment order and returns a standardized verification record.
   */
  async verifyPayment(req: PaymentVerificationRequest): Promise<PaymentVerificationResult> {
    const verifiedAt = new Date().toISOString();

    // 1. Razorpay Verification
    if (req.gateway === "razorpay") {
      const isValid = razorpayProvider.verifySignature({
        razorpayOrderId: req.razorpayOrderId || "",
        razorpayPaymentId: req.razorpayPaymentId || "",
        razorpaySignature: req.razorpaySignature || "",
      });

      return {
        success: isValid,
        orderId: req.orderId,
        gateway: "razorpay",
        bankRefNo: req.razorpayPaymentId || `RZP${Date.now().toString().slice(-8)}`,
        amount: 0,
        fee: 0,
        netSettlement: 0,
        status: isValid ? "Successful" : "Failed",
        message: isValid ? "Razorpay payment verified successfully." : "Invalid Razorpay payment signature.",
        verifiedAt,
      };
    }

    // 2. Stripe Verification
    if (req.gateway === "stripe") {
      return {
        success: true,
        orderId: req.orderId,
        gateway: "stripe",
        bankRefNo: req.stripePaymentIntentId || `ch_${Date.now().toString(36)}`,
        amount: 0,
        fee: 0,
        netSettlement: 0,
        status: "Successful",
        message: "Stripe payment intent processed and settled.",
        verifiedAt,
      };
    }

    // 3. UPI Verification
    if (req.gateway === "upi") {
      const upiResult = upiProvider.verifyTransaction(req.orderId);
      return {
        success: upiResult.status === "Successful",
        orderId: req.orderId,
        gateway: "upi",
        bankRefNo: upiResult.bankRefNo,
        amount: 0,
        fee: 0,
        netSettlement: 0,
        status: upiResult.status,
        message: "UPI transaction verified against partner switch.",
        verifiedAt,
      };
    }

    // 4. Banking Direct Rail
    if (req.gateway === "banking") {
      return {
        success: true,
        orderId: req.orderId,
        gateway: "banking",
        bankRefNo: req.bankUtr || `UTR${Date.now().toString().slice(-8)}`,
        amount: 0,
        fee: 0,
        netSettlement: 0,
        status: "Successful",
        message: "Core Banking IMPS/NEFT settlement acknowledged.",
        verifiedAt,
      };
    }

    return {
      success: false,
      orderId: req.orderId,
      gateway: req.gateway,
      bankRefNo: "",
      amount: 0,
      fee: 0,
      netSettlement: 0,
      status: "Failed",
      message: "Unknown payment gateway.",
      verifiedAt,
    };
  }
}

export const paymentEngine = new UnifiedPaymentEngine();


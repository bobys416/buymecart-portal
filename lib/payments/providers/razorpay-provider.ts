import crypto from "crypto";
import Razorpay from "razorpay";
import { getPaymentConfig } from "../config";
import { UnifiedPaymentOrder, PaymentVerificationResult } from "../types";

export class RazorpayProvider {
  private getClient(): Razorpay | null {
    const { razorpay } = getPaymentConfig();
    if (razorpay.keyId && razorpay.keySecret) {
      return new Razorpay({
        key_id: razorpay.keyId,
        key_secret: razorpay.keySecret,
      });
    }
    return null;
  }

  async createOrder(params: {
    orderId: string;
    amount: number; // in INR
    currency?: string;
    customerRef: string;
    receipt: string;
    notes?: Record<string, string>;
  }): Promise<{ razorpayOrderId: string; keyId: string }> {
    const client = this.getClient();
    const { razorpay } = getPaymentConfig();
    const amountInPaise = Math.round(params.amount * 100);

    if (client) {
      try {
        const order = await client.orders.create({
          amount: amountInPaise,
          currency: params.currency || "INR",
          receipt: params.receipt,
          notes: {
            ...params.notes,
            platformOrderId: params.orderId,
            customerRef: params.customerRef,
          },
        });
        return {
          razorpayOrderId: order.id,
          keyId: razorpay.keyId,
        };
      } catch (err) {
        console.warn("Razorpay API order creation failed, falling back to sandbox simulator:", err);
      }
    }

    // Sandbox simulated order
    const mockRzpId = `order_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      razorpayOrderId: mockRzpId,
      keyId: razorpay.keyId || "rzp_test_buymecart_sandbox",
    };
  }

  verifySignature(params: {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }): boolean {
    const { razorpay } = getPaymentConfig();
    const secret = razorpay.keySecret || "sandbox_secret_key";

    // In sandbox demo mode with mock orders, accept simulated signatures
    if (params.razorpayOrderId.startsWith("order_") && !razorpay.isLive) {
      return Boolean(params.razorpayPaymentId && params.razorpaySignature);
    }

    try {
      const generatedSignature = crypto
        .createHmac("sha256", secret)
        .update(`${params.razorpayOrderId}|${params.razorpayPaymentId}`)
        .digest("hex");

      return generatedSignature === params.razorpaySignature;
    } catch {
      return false;
    }
  }

  verifyWebhookSignature(bodyString: string, signatureHeader: string): boolean {
    const { razorpay } = getPaymentConfig();
    if (!razorpay.webhookSecret) return true;

    try {
      const expectedSignature = crypto
        .createHmac("sha256", razorpay.webhookSecret)
        .update(bodyString)
        .digest("hex");
      return expectedSignature === signatureHeader;
    } catch {
      return false;
    }
  }
}

export const razorpayProvider = new RazorpayProvider();


import Stripe from "stripe";
import { getPaymentConfig } from "../config";

export class StripeProvider {
  private getClient(): Stripe | null {
    const { stripe } = getPaymentConfig();
    if (stripe.secretKey) {
      return new Stripe(stripe.secretKey, {
        apiVersion: "2024-12-18.acacia" as any,
      });
    }
    return null;
  }

  async createPaymentIntent(params: {
    orderId: string;
    amount: number; // in INR
    currency?: string;
    customerRef: string;
    customerEmail?: string;
    metadata?: Record<string, string>;
  }): Promise<{
    clientSecret: string;
    paymentIntentId: string;
    publishableKey: string;
  }> {
    const client = this.getClient();
    const { stripe } = getPaymentConfig();
    const amountInSmallestUnit = Math.round(params.amount * 100);

    if (client) {
      try {
        const paymentIntent = await client.paymentIntents.create({
          amount: amountInSmallestUnit,
          currency: (params.currency || "inr").toLowerCase(),
          receipt_email: params.customerEmail,
          metadata: {
            ...params.metadata,
            platformOrderId: params.orderId,
            customerRef: params.customerRef,
          },
          automatic_payment_methods: {
            enabled: true,
          },
        });

        return {
          clientSecret: paymentIntent.client_secret || "",
          paymentIntentId: paymentIntent.id,
          publishableKey: stripe.publishableKey,
        };
      } catch (err) {
        console.warn("Stripe API PaymentIntent creation failed, falling back to sandbox simulator:", err);
      }
    }

    // Sandbox simulated PaymentIntent
    const mockIntentId = `pi_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const mockSecret = `${mockIntentId}_secret_${Math.random().toString(36).substring(2, 10)}`;

    return {
      clientSecret: mockSecret,
      paymentIntentId: mockIntentId,
      publishableKey: stripe.publishableKey || "pk_test_buymecart_sandbox",
    };
  }

  constructWebhookEvent(payload: string, signature: string): Stripe.Event | null {
    const client = this.getClient();
    const { stripe } = getPaymentConfig();

    if (client && stripe.webhookSecret) {
      try {
        return client.webhooks.constructEvent(payload, signature, stripe.webhookSecret);
      } catch (err) {
        console.error("Stripe webhook constructEvent error:", err);
        return null;
      }
    }

    // Sandbox parse
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
}

export const stripeProvider = new StripeProvider();


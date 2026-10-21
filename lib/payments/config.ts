import { GatewayHealthStatus } from "./types";

export interface PaymentGatewayConfig {
  razorpay: {
    keyId: string;
    keySecret: string;
    webhookSecret: string;
    isLive: boolean;
  };
  stripe: {
    publishableKey: string;
    secretKey: string;
    webhookSecret: string;
    isLive: boolean;
  };
  upi: {
    merchantVpa: string;
    merchantName: string;
    mcc: string;
    isLive: boolean;
  };
  banking: {
    baseUrl: string;
    clientId: string;
    clientSecret: string;
    debitAccount: string;
    debitIfsc: string;
    isLive: boolean;
  };
}

export function getPaymentConfig(): PaymentGatewayConfig {
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID || "";
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || "";
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
  const stripePublishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
  const bankClientId = process.env.BANK_CLIENT_ID || "";

  return {
    razorpay: {
      keyId: razorpayKeyId,
      keySecret: razorpayKeySecret,
      webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "bmc_rzp_webhook_secret_default",
      isLive: razorpayKeyId.startsWith("rzp_live_"),
    },
    stripe: {
      publishableKey: stripePublishableKey,
      secretKey: stripeSecretKey,
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "whsec_stripe_default",
      isLive: stripeSecretKey.startsWith("sk_live_"),
    },
    upi: {
      merchantVpa: process.env.UPI_MERCHANT_VPA || "buymecart@icici",
      merchantName: process.env.UPI_MERCHANT_NAME || "Buymecart Financial Services",
      mcc: process.env.UPI_MCC || "5411", // Grocery & Financial Point
      isLive: Boolean(process.env.UPI_MERCHANT_VPA && !process.env.UPI_MERCHANT_VPA.includes("sandbox")),
    },
    banking: {
      baseUrl: process.env.BANK_API_BASE_URL || "https://api-sandbox.buymecart.org/openbanking/v1",
      clientId: bankClientId,
      clientSecret: process.env.BANK_CLIENT_SECRET || "",
      debitAccount: process.env.BANK_DEBIT_ACCOUNT || "99201004561234",
      debitIfsc: process.env.BANK_DEBIT_IFSC || "UTIB0000045",
      isLive: Boolean(bankClientId && !bankClientId.toLowerCase().includes("sandbox")),
    },
  };
}

export function getGatewayHealthStatusList(): GatewayHealthStatus[] {
  const config = getPaymentConfig();

  return [
    {
      id: "upi",
      name: "NPCI Unified Payments Interface (UPI)",
      isConfigured: true,
      mode: config.upi.isLive ? "live" : "sandbox",
      features: ["Dynamic BharatQR", "UPI Intent / Deeplink", "Collect Flow", "Credit on UPI"],
      webhookEndpoint: "/api/payments/webhooks/upi",
      lastPingTimestamp: new Date().toISOString(),
    },
    {
      id: "razorpay",
      name: "Razorpay Payment Suite",
      isConfigured: Boolean(config.razorpay.keyId && config.razorpay.keySecret),
      mode: config.razorpay.isLive ? "live" : "sandbox",
      features: ["Razorpay Checkout", "Card Aggregator", "Net Banking Hub", "Auto-Refunds"],
      webhookEndpoint: "/api/payments/webhooks/razorpay",
      lastPingTimestamp: new Date().toISOString(),
    },
    {
      id: "banking",
      name: "Core Banking Direct Rail (IMPS / NEFT)",
      isConfigured: Boolean(config.banking.clientId),
      mode: config.banking.isLive ? "live" : "sandbox",
      features: ["Direct IMPS Payout", "NEFT Bulk Transfer", "Penny Drop Validation", "Bank UTR Reversal"],
      webhookEndpoint: "/api/payments/webhooks/banking",
      lastPingTimestamp: new Date().toISOString(),
    },
    {
      id: "stripe",
      name: "Stripe International & Domestic Cards",
      isConfigured: Boolean(config.stripe.secretKey && config.stripe.publishableKey),
      mode: config.stripe.isLive ? "live" : "sandbox",
      features: ["Stripe Elements", "Global Cards (Visa/Mastercard)", "3D Secure 2.0", "PaymentIntent API"],
      webhookEndpoint: "/api/payments/webhooks/stripe",
      lastPingTimestamp: new Date().toISOString(),
    },
  ];
}


import { NextResponse } from "next/server";
import { getGatewayHealthStatusList, getPaymentConfig } from "@/lib/payments/config";

export async function GET() {
  const statusList = getGatewayHealthStatusList();
  const config = getPaymentConfig();

  return NextResponse.json({
    gateways: statusList,
    publicKeys: {
      razorpayKeyId: config.razorpay.keyId || "rzp_test_buymecart_sandbox",
      stripePublishableKey: config.stripe.publishableKey || "pk_test_buymecart_sandbox",
      upiVpa: config.upi.merchantVpa,
      upiMerchantName: config.upi.merchantName,
    },
    systemTime: new Date().toISOString(),
  });
}


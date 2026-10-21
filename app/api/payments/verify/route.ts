import { NextRequest, NextResponse } from "next/server";
import { paymentEngine } from "@/lib/payments/engine";
import { PaymentVerificationRequest } from "@/lib/payments/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PaymentVerificationRequest;

    if (!body.gateway || !body.orderId) {
      return NextResponse.json(
        { error: "Invalid verification request. 'gateway' and 'orderId' are required." },
        { status: 400 }
      );
    }

    const result = await paymentEngine.verifyPayment(body);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Payment verification error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal payment verification error" },
      { status: 500 }
    );
  }
}


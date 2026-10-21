import { NextRequest, NextResponse } from "next/server";
import { paymentEngine } from "@/lib/payments/engine";
import { InitiatePaymentParams } from "@/lib/payments/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as InitiatePaymentParams;

    if (!body.gateway || !body.amount || body.amount <= 0) {
      return NextResponse.json(
        { error: "Invalid payment request. 'gateway' and positive 'amount' are required." },
        { status: 400 }
      );
    }

    const order = await paymentEngine.initiatePayment(body);
    return NextResponse.json({ success: true, order });
  } catch (err: any) {
    console.error("Payment initiation error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal payment processing error" },
      { status: 500 }
    );
  }
}


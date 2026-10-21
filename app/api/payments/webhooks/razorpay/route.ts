import { NextRequest, NextResponse } from "next/server";
import { razorpayProvider } from "@/lib/payments/providers/razorpay-provider";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-razorpay-signature") || "";

    const isValid = razorpayProvider.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json({ error: "Invalid Razorpay webhook signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    console.log(`[Webhook] Razorpay event received: ${event.event} for payment ${event.payload?.payment?.entity?.id}`);

    // Handle payment.captured, payment.failed, refund.processed etc.
    return NextResponse.json({ status: "ok", received: true });
  } catch (err: any) {
    console.error("Razorpay webhook error:", err);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}


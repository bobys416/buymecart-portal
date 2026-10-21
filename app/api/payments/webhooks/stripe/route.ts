import { NextRequest, NextResponse } from "next/server";
import { stripeProvider } from "@/lib/payments/providers/stripe-provider";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("stripe-signature") || "";

    const event = stripeProvider.constructWebhookEvent(rawBody, signature);
    if (!event) {
      return NextResponse.json({ error: "Invalid Stripe webhook signature" }, { status: 400 });
    }

    console.log(`[Webhook] Stripe event received: ${event.type} for id ${event.id}`);

    // Handle payment_intent.succeeded, payment_intent.payment_failed etc.
    return NextResponse.json({ status: "ok", received: true });
  } catch (err: any) {
    console.error("Stripe webhook error:", err);
    return NextResponse.json({ error: "Webhook handling failed" }, { status: 500 });
  }
}


import { NextRequest, NextResponse } from "next/server";
import { bankingApiProvider, BankingPayoutParams } from "@/lib/payments/providers/banking-api-provider";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as BankingPayoutParams;

    if (!body.amount || !body.beneficiaryAccount || !body.beneficiaryIfsc) {
      return NextResponse.json(
        { error: "amount, beneficiaryAccount, and beneficiaryIfsc are required for banking payout." },
        { status: 400 }
      );
    }

    const orderId = body.orderId || `BANK-${Date.now().toString().slice(-8)}`;
    const result = await bankingApiProvider.initiateTransfer({
      ...body,
      orderId,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Banking payout error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal banking transfer error" },
      { status: 500 }
    );
  }
}


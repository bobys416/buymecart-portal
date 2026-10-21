import { NextRequest, NextResponse } from "next/server";
import { bankingApiProvider } from "@/lib/payments/providers/banking-api-provider";
import { PennyDropVerificationRequest } from "@/lib/payments/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PennyDropVerificationRequest;

    if (!body.accountNumber || !body.ifsc) {
      return NextResponse.json(
        { error: "accountNumber and ifsc are required for penny drop verification." },
        { status: 400 }
      );
    }

    const result = await bankingApiProvider.verifyBeneficiaryAccount(body);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Penny drop validation error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal validation error" },
      { status: 500 }
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { generateMockFintechResponse } from "@/lib/ai/chatbot-service";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get("authorization");

    // Forward to FastAPI Backend AI endpoint
    try {
      const backendRes = await fetch(`${BACKEND_API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authHeader ? { Authorization: authHeader } : {}),
        },
        body: JSON.stringify({
          message: body.message,
          portal: body.portal || "retailer",
          conversation_id: body.conversation_id,
          model_id: body.model_id,
        }),
      });

      if (backendRes.ok) {
        const data = await backendRes.json();
        return NextResponse.json(data);
      }
    } catch {
      // Backend not currently reachable; proceed to safe local intelligence
    }

    // Resilient local synthetic intelligence fallback
    const mock = generateMockFintechResponse(body.message || "", null, body.portal || "retailer");
    return NextResponse.json({
      id: `ai-local-${Date.now()}`,
      conversation_id: `conv-local-${Date.now()}`,
      role: "assistant",
      content: mock.content,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      action_link: mock.actionLink,
      is_synthetic: true,
      model_id: "qwen2.5-coder-7b",
      tokens_used: 42,
      duration_ms: 15,
      safety_flagged: false,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Internal AI Copilot error" },
      { status: 500 }
    );
  }
}

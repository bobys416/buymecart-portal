import { UserSession } from "@/lib/auth";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  actionLink?: {
    label: string;
    url: string;
  };
  isDevelopmentMock: boolean;
}

export interface SendMessageOptions {
  message: string;
  history: ChatMessage[];
  session: UserSession | null;
  portal: string;
}

/**
 * Checks for prohibited sensitive credentials (OTPs, PINs, Passwords, CVV).
 */
export function containsSensitiveAuthSecrets(text: string): boolean {
  const lower = text.toLowerCase();
  const secretKeywords = [
    /\botp\b/i,
    /\bone[- ]time[- ]password\b/i,
    /\bpin\b/i,
    /\bmpin\b/i,
    /\bpassword\b/i,
    /\bcvv\b/i,
    /\bcvc\b/i,
    /\bcard[- ]pin\b/i,
    /\batm[- ]pin\b/i,
  ];

  return secretKeywords.some((pattern) => pattern.test(lower));
}

/**
 * Checks if the user is asking the assistant to directly execute or authorize a financial transaction.
 */
export function isAttemptingFinancialExecution(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    (lower.includes("transfer") && (lower.includes("now") || lower.includes("money") || lower.includes("rs"))) ||
    lower.includes("execute transaction") ||
    lower.includes("send payment now") ||
    lower.includes("authorize payout now") ||
    lower.includes("debit my wallet") ||
    lower.includes("credit account now")
  );
}

/**
 * Generates an intelligent, role-aware synthetic fintech assistant response.
 * Identifies explicitly as development mode synthetic intelligence.
 */
export function generateMockFintechResponse(
  prompt: string,
  session: UserSession | null,
  portal: string
): { content: string; actionLink?: { label: string; url: string } } {
  const text = prompt.toLowerCase();
  const role = session?.role || "retailer";
  const userPortal = portal.toLowerCase();

  // 1. Secret Protection Guard
  if (containsSensitiveAuthSecrets(prompt)) {
    return {
      content:
        "⚠️ **Security Notice:** Buymecart security governance strictly prohibits entering OTPs, PINs, passwords, or CVV codes. The AI Assistant will never request, store, or accept confidential credentials. If you suspect credential exposure, contact your security officer immediately.",
    };
  }

  // 2. Financial Execution Guard
  if (isAttemptingFinancialExecution(prompt)) {
    return {
      content:
        "⚠️ **Transaction Governance:** The AI Assistant is an informational and diagnostic copilot. In compliance with NPCI and banking regulatory Maker-Checker policies, it cannot independently authorize or execute financial debits or transfers. Please use your authorized portal workspace to initiate payments.",
      actionLink:
        userPortal === "retailer"
          ? { label: "Go to Start Payment", url: "/retailer/payments" }
          : userPortal === "admin"
          ? { label: "Go to Payment Authorizations", url: "/admin/payments?tab=authorize" }
          : undefined,
    };
  }

  // 3. Role-Based Scoping Violations
  if (role === "retailer" && (text.includes("admin key") || text.includes("root key") || text.includes("mcp") || text.includes("sd margin"))) {
    return {
      content:
        "🔒 **Access Restricted:** As a Retailer, you do not have authorization to view platform infrastructure keys, root credentials, or distributor margin schedules. Your permissions are scoped to retail operations, receipt generation, and transaction history.",
    };
  }

  if (role === "ad" && (text.includes("allocate limit to sd") || text.includes("clear balance query") || text.includes("super distributor settings"))) {
    return {
      content:
        "🔒 **Access Restricted:** Balance query clearing and regional limit allocations are restricted to Super Distributors. As an Area Distributor, your operations are focused on Retailer Onboarding, 12-point KYC collection, and hardware kit handovers.",
      actionLink: { label: "View Area Distributor Tasks", url: "/area-distributor/dashboard" },
    };
  }

  // 4. Transaction Status Explanations
  if (text.includes("pending") || text.includes("status") || text.includes("failed") || text.includes("disputed") || text.includes("reversed")) {
    return {
      content:
        "📊 **Transaction Status Guide:**\n\n" +
        "• **Successful (Green):** Funds settled on the core banking switch with valid Bank Reference Number (UTR).\n" +
        "• **Pending (Amber):** Switch acknowledgement awaited. The bank queue will reconcile within 10–15 minutes.\n" +
        "• **Failed (Red):** Declined by issuing switch (e.g. NPCI timeout, invalid IFSC, or insufficient balance). Immediate auto-reversal to wallet.\n" +
        "• **Reversed / Disputed (Purple):** Dispute registered or funds returned to customer source account.",
      actionLink:
        userPortal === "retailer"
          ? { label: "View Transaction History", url: "/retailer/transactions" }
          : { label: "View Payment Reports", url: "/admin/reports?tab=view-transactions" },
    };
  }

  // 5. Tempered Margin & Fee Explanations
  if (text.includes("margin") || text.includes("fee") || text.includes("tempered") || text.includes("charges") || text.includes("cost")) {
    return {
      content:
        "💰 **Standard Tempered Margin Fee Structure:**\n\n" +
        "• **Tier 1 (₹101 – ₹1,000):** Fixed fee of **₹7**\n" +
        "• **Tier 2 (₹1,001 – ₹2,000):** Fixed fee of **₹9**\n" +
        "• **Tier 3 (> ₹2,000):** Variable rate of **0.35%** (No statutory cap)\n" +
        "• **Sub-₹101:** Statutory exemption (Zero platform fee)\n\n" +
        "*Service overrides apply for UPI Collect (0.20%) and Credit Cards (0.50%).*",
      actionLink:
        userPortal === "admin"
          ? { label: "View Margin Schedule", url: "/admin/modifications?tab=commercial" }
          : undefined,
    };
  }

  // 6. Navigation: Super Distributor Management (Admin)
  if (text.includes("super distributor") || text.includes("sd management") || text.includes("onboard sd")) {
    if (role === "admin") {
      return {
        content:
          "🧭 **Super Distributor Management:** You can create new Super Distributors, adjust authorized credit limits, assign territories, and inspect downline network volume from the dedicated console.",
        actionLink: { label: "Open Super Distributor Console", url: "/admin/super-distributors" },
      };
    } else {
      return {
        content:
          "ℹ️ Super Distributor accounts oversee regional distribution networks and coordinate with Area Distributors.",
      };
    }
  }

  // 7. Navigation: Retailer Onboarding & KYC (AD / SD)
  if (text.includes("kyc") || text.includes("vkyc") || text.includes("onboard retailer") || text.includes("kit")) {
    if (role === "ad") {
      return {
        content:
          "📋 **Retailer Onboarding & vKYC Steps:**\n\n" +
          "1. **Initiate Form:** Enter applicant name, mobile number, shop name, and geo-coordinates.\n" +
          "2. **12-Point KYC:** Collect Aadhaar, PAN, MSME Udyam, and bank passbook.\n" +
          "3. **30-Second vKYC:** Record live video of applicant stating name, business address, and dynamic OTP.\n" +
          "4. **Kit Handover:** Issue serialized QR standee, MicroATM, and Biometric Scanner.",
        actionLink: { label: "Start Retailer Onboarding", url: "/area-distributor/onboarding" },
      };
    } else if (role === "admin") {
      return {
        content:
          "📋 **Compliance KYC Review:** View pending onboarding applications and verify 12-point KYC dossiers.",
        actionLink: { label: "Open Compliance Module", url: "/admin/compliance?tab=pending-onboarding" },
      };
    }
  }

  // 8. Navigation: Balance Queries & Fund Allocation (SD)
  if (text.includes("balance query") || text.includes("escalat") || text.includes("fund limit")) {
    if (role === "sd") {
      return {
        content:
          "💼 **Super Distributor Balance Management:** You have authorization to clear pending balance inquiries from assigned Area Distributors and allocate float limits within your approved ceiling.",
        actionLink: { label: "Open Balance Queries Tab", url: "/super-distributor/balance-queries" },
      };
    }
  }

  // 9. Receipts & Dispute Support (Retailer)
  if (text.includes("receipt") || text.includes("dispute") || text.includes("ticket") || text.includes("support")) {
    if (role === "retailer") {
      return {
        content:
          "🎫 **Support & Receipts:**\n\n" +
          "• Print neutral bank receipts without platform branding for your customers.\n" +
          "• If a transaction has an unresolved status after 30 minutes, raise a support ticket with the UTR.",
        actionLink: { label: "View Receipts", url: "/retailer/receipts" },
      };
    }
  }

  // 10. Default Contextual Welcome/Help
  return {
    content:
      `Hello ${session?.name || "User"}! I am your Buymecart Fintech Assistant.\n\n` +
      `I can assist with:\n` +
      `• **Transaction Explanations:** Real-time definitions of pending, failed, or reversed status.\n` +
      `• **Portal Navigation:** Direct deep-links to authorized forms, ledgers, and reports.\n` +
      `• **Policy & Compliance:** Guidance on 12-point KYC, vKYC protocols, and statutory fee calculations.\n\n` +
      `How can I help you today?`,
  };
}

/**
 * Service function to send a chat message.
 * Attempts future backend endpoint POST /api/ai/chat if available,
 * otherwise falls back to the robust development mock copilot.
 */
export async function sendChatMessage(options: SendMessageOptions): Promise<ChatMessage> {
  const { message, session, portal } = options;

  // Check if live backend AI endpoint is available
  try {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`;
    }

    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers,
      body: JSON.stringify({
        message,
        role: session?.role,
        portal,
        orgScope: session?.orgScope,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return {
        id: data.id || `ai-${Date.now()}`,
        role: "assistant",
        content: data.reply || data.content,
        timestamp: data.timestamp || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionLink: data.actionLink || data.action_link,
        isDevelopmentMock: data.is_synthetic ?? false,
      };
    }
  } catch {
    // Backend endpoint not active; proceed to synthetic dev intelligence
  }

  // Synthetic local dev intelligence
  const generated = generateMockFintechResponse(message, session, portal);

  return {
    id: `ai-${Date.now()}`,
    role: "assistant",
    content: generated.content,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    actionLink: generated.actionLink,
    isDevelopmentMock: true,
  };
}

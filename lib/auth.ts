export type UserRole = "admin" | "sd" | "ad" | "retailer";

export type PortalType =
  | "admin"
  | "super-distributor"
  | "area-distributor"
  | "retailer"
  | "distributor";

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  portal: PortalType;
  territory?: string;
  orgScope: string;
  assignedSD?: string;
  assignedAD?: string;
  permissions: string[];
  singleSessionActive: boolean;
  accessToken?: string;
  refreshToken?: string;
  createdAt?: string;
  expiresAt?: number;
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 4,
  sd: 3,
  ad: 2,
  retailer: 1,
};

export const ROLE_DISPLAY_NAMES: Record<UserRole, string> = {
  admin: "Admin",
  sd: "Super Distributor",
  ad: "Area Distributor",
  retailer: "Retailer",
};

export const PORTAL_ROLE_MAP: Record<string, UserRole> = {
  admin: "admin",
  "super-distributor": "sd",
  "area-distributor": "ad",
  retailer: "retailer",
};

export const PRESET_USERS: Record<string, UserSession> = {
  admin: {
    id: "USR-ADM-01",
    name: "Ananya Sen",
    email: "admin@buymecart.org",
    role: "admin",
    portal: "admin",
    orgScope: "GLOBAL_ROOT",
    permissions: ["*"],
    singleSessionActive: true,
  },
  "sd-central": {
    id: "USR-SD-01",
    name: "Arun Singh",
    email: "arun.sd@bspark.org",
    role: "sd",
    portal: "super-distributor",
    territory: "Central India Region",
    orgScope: "SD-CENTRAL-01",
    permissions: [
      "distributor:view",
      "distributor:sd",
      "network:ad:manage",
      "network:ad:verify",
      "balance:clear",
      "query:escalate",
      "commercial:view",
      "sd:dashboard",
      "funds:allocate",
    ],
    singleSessionActive: true,
  },
  "ad-bhopal": {
    id: "USR-AD-01",
    name: "Sunil Verma",
    email: "sunil.ad@bspark.org",
    role: "ad",
    portal: "area-distributor",
    territory: "Assigned Territory (Zone-01)",
    orgScope: "AD-ZONE-01",
    assignedSD: "SD-CENTRAL-01",
    permissions: [
      "distributor:view",
      "distributor:ad",
      "merchant:onboard:initiate",
      "merchant:onboard:submit",
      "kyc:collect",
      "kits:handover",
      "query:raise",
      "distributor:tx:view",
      "ad:dashboard",
    ],
    singleSessionActive: true,
  },
  "ad-primary": {
    id: "USR-AD-01",
    name: "Sunil Verma",
    email: "sunil.ad@bspark.org",
    role: "ad",
    portal: "area-distributor",
    territory: "Assigned Territory (Zone-01)",
    orgScope: "AD-ZONE-01",
    assignedSD: "SD-CENTRAL-01",
    permissions: [
      "distributor:view",
      "distributor:ad",
      "merchant:onboard:initiate",
      "merchant:onboard:submit",
      "kyc:collect",
      "kits:handover",
      "query:raise",
      "distributor:tx:view",
      "ad:dashboard",
    ],
    singleSessionActive: true,
  },
  retailer: {
    id: "USR-RT-01",
    name: "Rajesh Kumar Sharma",
    email: "rajesh.sharma@sharmadigital.in",
    role: "retailer",
    portal: "retailer",
    territory: "Jaipur, Rajasthan",
    orgScope: "MCH-00101",
    assignedAD: "AD-RAJ-01",
    permissions: [
      "retailer:dashboard",
      "payment:initiate",
      "receipts:view",
      "services:view",
      "retailer:support",
    ],
    singleSessionActive: true,
  },
};

// Resilient memory storage for environments without browser window/localStorage
const inMemoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  if (typeof window !== "undefined") {
    try {
      if (window.localStorage) {
        const val = window.localStorage.getItem(key);
        if (val !== null) return val;
      }
    } catch {
      // Fallback to in-memory
    }
  }
  return inMemoryStorage[key] || null;
}

function safeSetItem(key: string, value: string): void {
  if (typeof window !== "undefined") {
    try {
      if (window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Fallback
    }
  }
  inMemoryStorage[key] = value;
}

function safeRemoveItem(key: string): void {
  if (typeof window !== "undefined") {
    try {
      if (window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Fallback
    }
  }
  delete inMemoryStorage[key];
}

// Client and server session resolver - strictly returns null if no valid authenticated session exists
export function getStoredSession(portal: string): UserSession | null {
  const normalizedPortal = portal.toLowerCase();

  const stored = safeGetItem(`bmc_session_${normalizedPortal}`);
  if (stored) {
    try {
      const parsed: UserSession = JSON.parse(stored);
      // Check for session expiry if configured
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        clearStoredSession(normalizedPortal);
        return null;
      }
      return parsed;
    } catch {
      clearStoredSession(normalizedPortal);
      return null;
    }
  }

  // Cross-portal aliases check (e.g. if logged in as SD or AD, check shared keys)
  if (normalizedPortal === "distributor") {
    const sdStored = safeGetItem("bmc_session_super-distributor");
    if (sdStored) {
      try {
        const parsed = JSON.parse(sdStored);
        if (!parsed.expiresAt || Date.now() <= parsed.expiresAt) return parsed;
      } catch {}
    }
    const adStored = safeGetItem("bmc_session_area-distributor");
    if (adStored) {
      try {
        const parsed = JSON.parse(adStored);
        if (!parsed.expiresAt || Date.now() <= parsed.expiresAt) return parsed;
      } catch {}
    }
  }

  // Unauthenticated: return null. Never fabricate a session.
  return null;
}

// Development and fixture helper ONLY (isolated from production session lookup)
export function getDevPresetUser(roleKey: keyof typeof PRESET_USERS): UserSession {
  return PRESET_USERS[roleKey] || PRESET_USERS.admin;
}

export function setStoredSession(session: UserSession, validityMinutes = 480): void {
  const enhancedSession: UserSession = {
    ...session,
    createdAt: session.createdAt || new Date().toISOString(),
    expiresAt: session.expiresAt || (Date.now() + validityMinutes * 60 * 1000),
  };
  const json = JSON.stringify(enhancedSession);
  safeSetItem(`bmc_session_${enhancedSession.portal}`, json);

  // Sync role-based keys for cross-portal consistency
  if (enhancedSession.role === "admin") {
    safeSetItem("bmc_session_admin", json);
  } else if (enhancedSession.role === "sd") {
    safeSetItem("bmc_session_super-distributor", json);
    safeSetItem("bmc_session_distributor", json);
  } else if (enhancedSession.role === "ad") {
    safeSetItem("bmc_session_area-distributor", json);
    safeSetItem("bmc_session_distributor", json);
  } else if (enhancedSession.role === "retailer") {
    safeSetItem("bmc_session_retailer", json);
  }
}

export function clearStoredSession(portal: string): void {
  const normalizedPortal = portal.toLowerCase();
  safeRemoveItem(`bmc_session_${normalizedPortal}`);

  if (normalizedPortal === "distributor") {
    safeRemoveItem("bmc_session_super-distributor");
    safeRemoveItem("bmc_session_area-distributor");
  } else if (normalizedPortal === "super-distributor") {
    safeRemoveItem("bmc_session_distributor");
  } else if (normalizedPortal === "area-distributor") {
    safeRemoveItem("bmc_session_distributor");
  }
}

export function hasPermission(session: UserSession, requiredPerm: string): boolean {
  if (session.permissions.includes("*")) return true;
  return session.permissions.includes(requiredPerm);
}

/**
 * Validates whether the active session has authorization for the given portal path.
 * Enforces strict portal separation per the four-portal security architecture.
 */
export function validatePortalAccess(
  session: UserSession | null,
  portal: string
): { authorized: boolean; reason?: string; requiredRole?: UserRole; unauthenticated?: boolean } {
  if (!session) {
    return {
      authorized: false,
      reason: "Authentication required. Please sign in with authorized credentials to access this portal.",
      unauthenticated: true,
    };
  }

  // Check expiration
  if (session.expiresAt && Date.now() > session.expiresAt) {
    return {
      authorized: false,
      reason: "Your session has expired. Please sign in again to continue.",
      unauthenticated: true,
    };
  }

  const normalized = portal.toLowerCase();

  if (normalized === "admin") {
    if (session.role !== "admin") {
      return {
        authorized: false,
        reason: `Access restricted. Your role (${ROLE_DISPLAY_NAMES[session.role]}) is not authorized to access the Admin Master Portal.`,
        requiredRole: "admin",
      };
    }
    return { authorized: true };
  }

  if (normalized === "super-distributor" || normalized === "sd") {
    if (session.role !== "sd") {
      return {
        authorized: false,
        reason: `Access restricted. Your role (${ROLE_DISPLAY_NAMES[session.role]}) is not authorized to access the Super Distributor Portal. Only designated Super Distributors can enter.`,
        requiredRole: "sd",
      };
    }
    return { authorized: true };
  }

  if (normalized === "area-distributor" || normalized === "ad") {
    if (session.role !== "ad") {
      return {
        authorized: false,
        reason: `Access restricted. Your role (${ROLE_DISPLAY_NAMES[session.role]}) is not authorized to access the Area Distributor Portal. Only designated Area Distributors can enter.`,
        requiredRole: "ad",
      };
    }
    return { authorized: true };
  }

  if (normalized === "retailer") {
    if (session.role !== "retailer") {
      return {
        authorized: false,
        reason: `Access restricted. Your role (${ROLE_DISPLAY_NAMES[session.role]}) is not authorized to access the Retailer Portal. Only active merchants and retailers can enter.`,
        requiredRole: "retailer",
      };
    }
    return { authorized: true };
  }

  if (normalized === "distributor") {
    if (session.role !== "sd" && session.role !== "ad") {
      return {
        authorized: false,
        reason: "Access restricted. You must have an authorized Super Distributor or Area Distributor account to view this section.",
        requiredRole: "ad",
      };
    }
    return { authorized: true };
  }

  return { authorized: false, reason: "Unknown portal path." };
}

export interface BackendLoginResult {
  success: boolean;
  session?: UserSession;
  portal?: PortalType;
  error?: string;
}

/**
 * Authenticates user credentials directly against the FastAPI /api/v1/auth/login endpoint.
 * Returns authoritative session on 200 OK with signed JWT tokens.
 */
export async function loginWithBackend(
  loginId: string,
  password: string
): Promise<BackendLoginResult> {
  const apiUrl =
    (typeof process !== "undefined" && process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")
      : "http://localhost:8000/api/v1");

  try {
    const res = await fetch(`${apiUrl}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        login_id: loginId.trim(),
        password: password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const errorMsg =
        typeof data.detail === "string"
          ? data.detail
          : "Invalid credentials. Please verify your login ID and password.";
      return { success: false, error: errorMsg };
    }

    const u = data.user;
    const roleMapping: Record<string, { role: UserRole; portal: PortalType }> = {
      ADMIN: { role: "admin", portal: "admin" },
      SUPER_DISTRIBUTOR: { role: "sd", portal: "super-distributor" },
      AREA_DISTRIBUTOR: { role: "ad", portal: "area-distributor" },
      RETAILER: { role: "retailer", portal: "retailer" },
    };

    const mapped = roleMapping[u.role] || { role: "retailer", portal: "retailer" };

    const session: UserSession = {
      id: u.id,
      name: u.full_name,
      email: u.email || u.login_id,
      role: mapped.role,
      portal: mapped.portal,
      territory: u.territory || undefined,
      orgScope: u.business_name || mapped.portal.toUpperCase(),
      permissions: u.permissions || ["*"],
      singleSessionActive: true,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      createdAt: new Date().toISOString(),
      expiresAt: Date.now() + (data.expires_in || 3600) * 1000,
    };

    setStoredSession(session);
    return { success: true, session, portal: mapped.portal };
  } catch (err: any) {
    return {
      success: false,
      error:
        err.message ||
        "Unable to connect to BuyMeCart authentication service. Please check backend status.",
    };
  }
}

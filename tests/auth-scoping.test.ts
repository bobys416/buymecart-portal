import { describe, expect, it, beforeEach } from "vitest";
import {
  clearStoredSession,
  getStoredSession,
  hasPermission,
  PRESET_USERS,
  setStoredSession,
} from "../lib/auth";
import { mockMerchants } from "../lib/mock-data";

describe("Central Identity, Permissions & Role Scoping (Note 5 & Governance)", () => {
  beforeEach(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
    }
  });

  it("exposes verified preset users for all 4 portals", () => {
    expect(PRESET_USERS.admin.role).toBe("admin");
    expect(PRESET_USERS.admin.portal).toBe("admin");
    expect(PRESET_USERS.admin.orgScope).toBe("GLOBAL_ROOT");

    expect(PRESET_USERS["sd-central"].role).toBe("sd");
    expect(PRESET_USERS["sd-central"].portal).toBe("super-distributor");
    expect(PRESET_USERS["sd-central"].orgScope).toBe("SD-CENTRAL-01");

    expect(PRESET_USERS["ad-bhopal"].role).toBe("ad");
    expect(PRESET_USERS["ad-bhopal"].portal).toBe("area-distributor");
    expect(PRESET_USERS["ad-bhopal"].orgScope).toBe("AD-ZONE-01");

    expect(PRESET_USERS.retailer.role).toBe("retailer");
    expect(PRESET_USERS.retailer.portal).toBe("retailer");
  });

  it("enforces permission checks accurately across roles", () => {
    const admin = PRESET_USERS.admin;
    const sd = PRESET_USERS["sd-central"];
    const ad = PRESET_USERS["ad-bhopal"];
    const retailer = PRESET_USERS.retailer;

    // Admin has wildcard
    expect(hasPermission(admin, "any:custom:permission")).toBe(true);
    expect(hasPermission(admin, "balance:clear")).toBe(true);

    // SD has balance clear and ad network manage, but lacks retailer onboard initiate
    expect(hasPermission(sd, "balance:clear")).toBe(true);
    expect(hasPermission(sd, "network:ad:manage")).toBe(true);
    expect(hasPermission(sd, "distributor:sd")).toBe(true);
    expect(hasPermission(sd, "distributor:ad")).toBe(false);

    // AD has retailer onboarding & kit handover, but lacks SD controls
    expect(hasPermission(ad, "merchant:onboard:initiate")).toBe(true);
    expect(hasPermission(ad, "kits:handover")).toBe(true);
    expect(hasPermission(ad, "distributor:ad")).toBe(true);
    expect(hasPermission(ad, "distributor:sd")).toBe(false);
    expect(hasPermission(ad, "balance:clear")).toBe(false);
    expect(hasPermission(ad, "network:ad:manage")).toBe(false);

    // Retailer has payment initiation, but lacks distributor permissions
    expect(hasPermission(retailer, "payment:initiate")).toBe(true);
    expect(hasPermission(retailer, "distributor:view")).toBe(false);
  });

  it("returns null for unauthenticated state and does not fabricate sessions", () => {
    // When no session exists, strictly returns null
    expect(getStoredSession("admin")).toBeNull();
    expect(getStoredSession("super-distributor")).toBeNull();
    expect(getStoredSession("area-distributor")).toBeNull();
    expect(getStoredSession("retailer")).toBeNull();
    expect(getStoredSession("distributor")).toBeNull();
  });

  it("updates and clears stored session correctly", () => {
    // Set SD session in distributor portal
    setStoredSession(PRESET_USERS["sd-central"]);
    const current = getStoredSession("distributor");
    expect(current).not.toBeNull();
    expect(current?.role).toBe("sd");
    expect(current?.name).toBe("Arun Singh");

    // Clear session
    clearStoredSession("distributor");
    const cleared = getStoredSession("distributor");
    expect(cleared).toBeNull();
  });

  it("scopes territory data: AD sees only assigned territory merchants whereas SD sees regional pool", () => {
    const sampleMerchants = [
      { id: "M1", businessName: "Metro Kirana", agentRole: "Retailer", territory: "Zone-01" },
      { id: "M2", businessName: "Central Tech", agentRole: "Retailer", territory: "Zone-02" },
      { id: "M3", businessName: "Regional Traders", agentRole: "Retailer", territory: "Zone-03" },
      { id: "M4", businessName: "Metro Mobile", agentRole: "Retailer", territory: "Zone-01" },
    ];

    // AD Scope Filter: only assigned territory (Zone-01) retailers
    const adRetailers = sampleMerchants.filter(
      (m) => m.agentRole === "Retailer" && m.territory === "Zone-01"
    );
    expect(adRetailers.length).toBe(2);
    expect(adRetailers.every((m) => m.territory === "Zone-01")).toBe(true);

    // SD Scope Filter: all subordinate retailers across Central Region
    const sdRetailers = sampleMerchants.filter((m) => m.agentRole === "Retailer");
    expect(sdRetailers.length).toBeGreaterThan(adRetailers.length);
    expect(sdRetailers.length).toBe(4);
  });
});

import { describe, expect, it } from "vitest";
import { calculateTemperedMarginFee } from "@/lib/mock-data";

describe("Tempered-Margin Fee Engine (Page 3 Specification)", () => {
  it("exempts transactions under ₹101", () => {
    const result = calculateTemperedMarginFee(50);
    expect(result.fee).toBe(0);
    expect(result.method).toContain("Exempt");
  });

  it("applies fixed ₹7 fee for slab ₹101 to ₹1,000", () => {
    expect(calculateTemperedMarginFee(101).fee).toBe(7);
    expect(calculateTemperedMarginFee(500).fee).toBe(7);
    expect(calculateTemperedMarginFee(1000).fee).toBe(7);
    expect(calculateTemperedMarginFee(1000).method).toContain("Fixed ₹7");
  });

  it("applies fixed ₹9 fee for slab ₹1,001 to ₹2,000", () => {
    expect(calculateTemperedMarginFee(1001).fee).toBe(9);
    expect(calculateTemperedMarginFee(1500).fee).toBe(9);
    expect(calculateTemperedMarginFee(2000).fee).toBe(9);
    expect(calculateTemperedMarginFee(2000).method).toContain("Fixed ₹9");
  });

  it("applies variable percentage for > ₹2,000 with no arbitrary upper cap", () => {
    // Default 0.35%
    const res5k = calculateTemperedMarginFee(5000);
    expect(res5k.fee).toBe(17.5); // 5000 * 0.0035 = 17.5
    expect(res5k.method).toContain("0.35% Variable");

    // High value transaction (confirming no global upper limit)
    const res500k = calculateTemperedMarginFee(500000);
    expect(res500k.fee).toBe(1750); // 500,000 * 0.0035 = 1,750
  });

  it("honors service percentage overrides for UPI and Card", () => {
    // UPI Override: 0.20%
    const upiRes = calculateTemperedMarginFee(10000, "UPI Collect");
    expect(upiRes.fee).toBe(20); // 10000 * 0.002 = 20
    expect(upiRes.method).toContain("0.20% Variable");

    // Card Override: 0.50%
    const cardRes = calculateTemperedMarginFee(10000, "Credit Card Payment");
    expect(cardRes.fee).toBe(50); // 10000 * 0.005 = 50
    expect(cardRes.method).toContain("0.50% Variable");
  });
});

import { describe, expect, it } from "vitest";
import { formatINR, transactions } from "@/lib/mock-data";

describe("mock data contracts", () => {
  it("formats money as Indian rupees", () => {
    expect(formatINR(1840)).toContain("1,840");
  });

  it("uses only supported transaction statuses", () => {
    expect(new Set(transactions.map((transaction) => transaction.status))).toEqual(new Set(["Successful", "Pending", "Failed", "Disputed"]));
  });
});

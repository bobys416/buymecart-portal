import { describe, expect, it } from "vitest";
import {
  formatINR,
  mockMerchants,
  mockPaymentTransactions,
  mockSupportTickets,
  transactionStatuses,
} from "@/lib/mock-data";

describe("zero-data initial state & contract tests", () => {
  it("formats money as Indian rupees", () => {
    expect(formatINR(1840)).toContain("1,840");
    expect(formatINR(0)).toContain("0");
  });

  it("verifies clean zero state with no dummy merchants, transactions, or tickets", () => {
    expect(mockMerchants).toHaveLength(0);
    expect(mockPaymentTransactions).toHaveLength(0);
    expect(mockSupportTickets).toHaveLength(0);
  });

  it("validates supported transaction status definitions", () => {
    expect(new Set(transactionStatuses)).toEqual(
      new Set(["Successful", "Pending", "Failed", "Disputed"])
    );
  });
});

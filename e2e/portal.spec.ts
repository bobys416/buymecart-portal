import { expect, test } from "@playwright/test";

test("admin master dashboard renders telemetry, details panel, and navigates to merchants", async ({
  page,
}, testInfo) => {
  await page.goto("/admin/dashboard");
  await expect(page.getByText("Platform Master Dashboard (CRM)")).toBeVisible();
  await expect(page.getByText("Banking Products (DMT/IMPS)")).toBeVisible();
  await expect(page.getByText("DEMO DATA · PHASE 1 EVALUATION")).toBeVisible();

  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Toggle navigation" }).click();
  }

  // Navigate to Merchant Management
  await page.getByRole("link", { name: "Search Merchant" }).first().click();
  await expect(page.getByText("Merchant Management")).toBeVisible();
  await expect(page.getByText("Search & Filter Merchant Records")).toBeVisible();
});

test("admin portal exposes payment operations and tempered margin plan", async ({ page }) => {
  await page.goto("/admin/payments?tab=authorize");
  await expect(page.getByText("Payment Operations & Settlements")).toBeVisible();
  await expect(page.getByText("Authorize Payments (Approve Pay Queue)")).toBeVisible();

  // Navigate to Tempered Margin Modifications
  await page.goto("/admin/modifications?tab=commercial");
  await expect(page.getByText("Tempered Margin Cost Schedule (Page 3 Specification)")).toBeVisible();
  await expect(page.getByText("Slab 1 (₹101 to ₹1,000)")).toBeVisible();
  await expect(page.getByText("Slab 2 (₹1,001 to ₹2,000)")).toBeVisible();
});

test("retailer portal initiates payment and renders neutral receipt with NO logos (Note 1)", async ({
  page,
}) => {
  await page.goto("/retailer/dashboard");
  await expect(page.getByText("Retailer Operating Console")).toBeVisible();
  await expect(page.getByText("Note 5: 1 ID Login Active Lock")).toBeVisible();

  // Check Receipts Tab
  await page.getByRole("button", { name: "Transaction Slip / Receipt (No Logos)" }).click();
  await expect(page.getByText("Compliance Note 1 from Source PDF:")).toBeVisible();
  await expect(page.getByText("ELECTRONIC TRANSACTION RECEIPT")).toBeVisible();
});

test("distributor portal switches between Area Distributor (AD) and Super Distributor (SD) roles", async ({
  page,
}) => {
  await page.goto("/distributor/dashboard");
  await expect(page.getByText("Area Distributor (AD) Workspace")).toBeVisible();

  // Switch to SD
  await page.getByRole("button", { name: "Super Distributor (SD)" }).click();
  await expect(page.getByText("Super Distributor (SD) Command View")).toBeVisible();
  await expect(page.getByText("Assigned Area Distributors")).toBeVisible();
});

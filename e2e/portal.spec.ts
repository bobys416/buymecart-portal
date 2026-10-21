import { expect, test } from "@playwright/test";

test("multi-portal directory presents all portals and compliance notices", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/BuyMeCart Financial Services Platform/i)).toBeVisible();
  await expect(page.getByText("PORTAL 1: ADMIN")).toBeVisible();
  await expect(page.getByText("PORTAL 2: SUPER DIST")).toBeVisible();
  await expect(page.getByText("PORTAL 4: RETAILER")).toBeVisible();
  await expect(page.locator("main").getByText("Note 1: Neutral Receipt")).toBeVisible();
  await expect(page.locator("main").getByText("Note 5: 1 ID Session Lock")).toBeVisible();
  await expect(page.locator("main").getByText("Page 3: Tempered Margins")).toBeVisible();
});

test("admin login and master dashboard renders telemetry, details panel, and navigates to merchants", async ({
  page,
}, testInfo) => {
  // Test dedicated login entry point
  await page.goto("/admin/login");
  await expect(page.getByText("BUYMECART ADMIN PORTAL")).toBeVisible();
  await page.getByRole("button", { name: "One-Click Root Admin Sign In" }).click();

  // Redirected to Admin Master Dashboard
  await expect(page).toHaveURL(/.*\/admin\/dashboard/);
  await expect(page.getByText("Platform Master Dashboard (CRM)")).toBeVisible();
  await expect(page.getByText("Banking Products (DMT/IMPS)")).toBeVisible();
  await expect(page.getByText("Admin Master Console")).toBeVisible();

  if (testInfo.project.name === "mobile") {
    const toggleBtn = page.getByRole("button", { name: "Toggle navigation" });
    if (await toggleBtn.isVisible()) {
      await toggleBtn.click();
    }
  }

  // Navigate to Merchant Management
  await page.getByRole("link", { name: "Search Merchant" }).first().click();
  await expect(page.getByText("Merchant Management")).toBeVisible();
  await expect(page.getByText("Search & Filter Merchant Records")).toBeVisible();
});

test("admin portal exposes payment operations and tempered margin plan", async ({ page }) => {
  await page.goto("/admin/login");
  await page.getByRole("button", { name: "One-Click Root Admin Sign In" }).click();
  await expect(page).toHaveURL(/.*\/admin\/dashboard/);

  await page.goto("/admin/payments?tab=authorize");
  await expect(page.getByText("Payment Operations & Settlements")).toBeVisible();
  await expect(page.getByText("Authorize Payments (Approve Pay Queue)")).toBeVisible();

  // Navigate to Tempered Margin Modifications
  await page.goto("/admin/modifications?tab=commercial");
  await expect(page.getByText("Tempered Margin Cost Schedule (Page 3 Specification)")).toBeVisible();
  await expect(page.getByText("Slab 1 (₹101 to ₹1,000)")).toBeVisible();
  await expect(page.getByText("Slab 2 (₹1,001 to ₹2,000)")).toBeVisible();
});

test("distributor portal isolates Area Distributor (AD) scope and renders workspace", async ({
  page,
}) => {
  // Sign in as Area Distributor via dedicated login entry point
  await page.goto("/distributor/login");
  await expect(page.getByText("BUYMECART DISTRIBUTOR PORTAL")).toBeVisible();
  await page.getByRole("button", { name: /Area Distributor/i }).click();

  // Redirected to AD Workspace
  await expect(page).toHaveURL(/.*\/area-distributor\/dashboard/);
  await expect(page.getByText("Area Distributor Workspace")).toBeVisible();
  await expect(page.getByText("AREA DISTRIBUTOR PORTAL", { exact: true }).first()).toBeVisible();
});

test("distributor portal allows Super Distributor (SD) to oversee ADs and clear balance queries", async ({
  page,
}) => {
  // Sign in as Super Distributor via dedicated login entry point
  await page.goto("/distributor/login");
  await page.getByRole("button", { name: /Super Distributor/i }).click();

  // Redirected to SD Command Console
  await expect(page).toHaveURL(/.*\/super-distributor\/dashboard/);
  await expect(page.getByText("Super Distributor Command Console")).toBeVisible();
  await expect(page.getByRole("link", { name: "Area Distributors (ADs)" })).toBeVisible();

  // Click on the sidebar tab that navigates to the Clear Balance Queries view
  await page.getByRole("button", { name: "Clear Balance Queries", exact: true }).first().click();
  await expect(page.getByText("Clear Balance Queries").first()).toBeVisible();

  // Resolve balance query
  await page.getByRole("button", { name: "Clear Query ✓" }).first().click();
  await expect(page.getByText("Cleared ✓").first()).toBeVisible();
});

test("retailer portal initiates payment and renders neutral receipt with NO logos (Note 1)", async ({
  page,
}) => {
  // Sign in as Retailer via dedicated login entry point
  await page.goto("/retailer/login");
  await expect(page.getByText("BUYMECART RETAILER TERMINAL")).toBeVisible();
  await page.getByRole("button", { name: "One-Click Retailer Sign In" }).click();

  // Redirected to Retailer Operating Console
  await expect(page).toHaveURL(/.*\/retailer\/dashboard/);
  await expect(page.getByText("Retailer Operating Console")).toBeVisible();
  await expect(page.getByText("Note 5: 1 ID Login Active Lock")).toBeVisible();

  // Check Receipts Tab
  await page.getByRole("button", { name: "Transaction Slip / Receipt (No Logos)" }).click();
  await expect(page.getByText("Compliance Note 1 from Source PDF:")).toBeVisible();
  await expect(page.getByText("ELECTRONIC TRANSACTION RECEIPT")).toBeVisible();
});

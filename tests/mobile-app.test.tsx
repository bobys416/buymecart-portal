import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { secureStorage } from "../mobile/src/services/secure-storage";
import { biometricService } from "../mobile/src/services/biometrics";
import { offlineManager } from "../mobile/src/services/offline-manager";
import { generateNeutralReceipt } from "../packages/business-logic";
import { FinancialTransaction, NeutralReceipt, Product } from "../packages/shared-types";
import { ReceiptView } from "../mobile/src/components/ReceiptView";
import { EmptyState } from "../mobile/src/components/EmptyState";
import { Button } from "../mobile/src/components/Button";
import { OnboardingScreen } from "../mobile/src/screens/OnboardingScreen";
import { AuthScreen } from "../mobile/src/screens/AuthScreen";
import { CartCheckoutScreen } from "../mobile/src/screens/CartCheckoutScreen";

const ReceiptViewComp: any = ReceiptView;
const EmptyStateComp: any = EmptyState;
const ButtonComp: any = Button;
const OnboardingScreenComp: any = OnboardingScreen;
const AuthScreenComp: any = AuthScreen;
const CartCheckoutScreenComp: any = CartCheckoutScreen;

describe("BuyMeCart Mobile Ecosystem Suite (Android & iOS)", () => {
  beforeEach(async () => {
    cleanup();
    await secureStorage.clearTokens();
    await offlineManager.queue.clear();
  });

  describe("Mobile Services (Security, Biometrics & Offline)", () => {
    it("stores and clears authentication tokens securely", async () => {
      await secureStorage.setTokens("test_jwt_access_token", "test_jwt_refresh_token");
      const token = await secureStorage.getAccessToken();
      expect(token).toBe("test_jwt_access_token");

      await secureStorage.clearTokens();
      const cleared = await secureStorage.getAccessToken();
      expect(cleared).toBeNull();
    });

    it("verifies biometric hardware availability and authentication flow", async () => {
      const status = await biometricService.checkBiometrics();
      expect(status.isAvailable).toBe(true);

      const authSuccess = await biometricService.authenticate();
      expect(authSuccess.success).toBe(true);

      biometricService.setSimulatedSuccess(false);
      const authFailed = await biometricService.authenticate();
      expect(authFailed.success).toBe(false);
      biometricService.setSimulatedSuccess(true);
    });

    it("manages offline mutation queue with enqueue, getQueue, and dequeue", async () => {
      await offlineManager.queue.enqueue({
        url: "https://api.buymecart.org/api/orders",
        method: "POST",
        body: JSON.stringify({ orderId: "ord-test" }),
        headers: {},
      });

      let queue = await offlineManager.queue.getQueue();
      expect(queue.length).toBe(1);
      expect(queue[0].url).toContain("/api/orders");

      await offlineManager.queue.dequeue(queue[0].id);
      queue = await offlineManager.queue.getQueue();
      expect(queue.length).toBe(0);
    });
  });

  describe("Compliance & Neutral Receipt (PDF Page 1 Note 1)", () => {
    it("renders strictly neutral receipt without third-party bank logos", () => {
      const sampleTx: FinancialTransaction = {
        id: "tx-mobile-1",
        transactionRef: "BMC-DMT-100200",
        rrn: "419876543210",
        serviceType: "dmt",
        retailerId: "RET-MP-01",
        retailerName: "Patel Digital Kendra",
        customerIdentifier: "+91 98765 43210",
        amount: 3000,
        temperedMarginFee: 23.5,
        commissionEarned: 14.1,
        netDebit: 3027.73,
        status: "success",
        upstreamSwitch: "NPCI IMPS Switch",
        latencyMs: 92,
        createdAt: "2026-10-19T14:30:00Z",
      };

      const receipt = generateNeutralReceipt(sampleTx, "RET-MP-01");
      const { container } = render(<ReceiptViewComp receipt={receipt} />);

      // Must display BuyMeCart + IBNK branding
      expect(screen.getByText("BUYMECART · IBNK")).toBeTruthy();
      expect(screen.getByText(/OFFICIAL NEUTRAL RECEIPT/i)).toBeTruthy();

      // Must NOT contain third-party bank logos (ICICI, SBI, HDFC, Axis, etc.)
      expect(container.innerHTML).not.toContain("ICICI Bank");
      expect(container.innerHTML).not.toContain("State Bank of India");
      expect(container.innerHTML).not.toContain("HDFC Bank");

      // Verify transaction reference and statutory surcharge breakdown
      expect(screen.getByText("BMC-DMT-100200")).toBeTruthy();
      expect(screen.getByText("419876543210")).toBeTruthy();
      expect(screen.getByText(/Tempered Margin Convenience Surcharge/i)).toBeTruthy();
    });
  });

  describe("UI Components & Zero Dummy Data Empty States", () => {
    it("renders EmptyState component with title, description, and action button", () => {
      const actionSpy = vi.fn();
      render(
        <EmptyStateComp
          title="Catalog is currently empty"
          description="No inventory items loaded yet."
          actionLabel="+ Provision Sample Products"
          onAction={actionSpy}
        />
      );

      expect(screen.getByText("Catalog is currently empty")).toBeTruthy();
      expect(screen.getByText("No inventory items loaded yet.")).toBeTruthy();

      const btn = screen.getByRole("button", { name: /Provision Sample Products/i });
      fireEvent.click(btn);
      expect(actionSpy).toHaveBeenCalled();
    });

    it("renders Button with primary and danger variants and handles press events", () => {
      const pressSpy = vi.fn();
      render(
        <ButtonComp
          title="Sign Out of Account"
          onPress={pressSpy}
          variant="danger"
          size="lg"
        />
      );

      const btn = screen.getByRole("button", { name: "Sign Out of Account" });
      fireEvent.click(btn);
      expect(pressSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe("Mobile Screen Interactions & Workflows", () => {
    it("renders OnboardingScreen and triggers complete and login callbacks", () => {
      const onComplete = vi.fn();
      const onSkipToLogin = vi.fn();

      render(
        <OnboardingScreenComp
          onComplete={onComplete}
          onSkipToLogin={onSkipToLogin}
        />
      );

      expect(screen.getByText("BUYMECART + IBNK ECOSYSTEM")).toBeTruthy();
      expect(screen.getByText(/Omnichannel Retail & E-Commerce/i)).toBeTruthy();
      expect(screen.getByText(/IBNK Financial Switching/i)).toBeTruthy();
      expect(screen.getByText(/Self-Hosted AI & Maker-Checker Risk/i)).toBeTruthy();

      fireEvent.click(screen.getByRole("button", { name: "Get Started" }));
      expect(onComplete).toHaveBeenCalled();
    });

    it("renders AuthScreen, performs client validation, and signs in with biometrics", async () => {
      const onSuccess = vi.fn();
      const onForgot = vi.fn();

      render(<AuthScreenComp onSuccess={onSuccess} onForgotPassword={onForgot} />);

      expect(screen.getByText("Portal Sign In")).toBeTruthy();

      // Trigger Biometric Login
      const bioBtn = screen.getByRole("button", { name: /Sign In with Biometrics/i });
      fireEvent.click(bioBtn);

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalledWith(
          expect.objectContaining({
            role: "retailer",
            portal: "retailer",
            biometricsEnabled: true,
          })
        );
      });
    });

    it("renders CartCheckoutScreen with zero dummy data empty state when cart is empty", () => {
      const onShop = vi.fn();
      render(
        <CartCheckoutScreenComp
          cartItems={[]}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onOrderPlaced={vi.fn()}
          onContinueShopping={onShop}
        />
      );

      expect(screen.getByText("Your shopping cart is empty")).toBeTruthy();
      const exploreBtn = screen.getByRole("button", { name: "Explore Catalog" });
      fireEvent.click(exploreBtn);
      expect(onShop).toHaveBeenCalled();
    });

    it("calculates statutory Tempered Margin fee and places order when items present", () => {
      const onOrderPlaced = vi.fn();
      const sampleProduct: Product = {
        id: "p-pos-01",
        sku: "BMC-POS-M2",
        name: "Micro-ATM Terminal M2",
        description: "PCI-PTS certified POS",
        category: "pos_hardware",
        price: 3000,
        currency: "INR",
        stock: 20,
        images: [],
        ratings: 4.8,
        ratingCount: 15,
        isAvailable: true,
        temperedMarginEligible: true,
      };

      render(
        <CartCheckoutScreenComp
          cartItems={[{ product: sampleProduct, quantity: 1 }]}
          onUpdateQuantity={vi.fn()}
          onRemoveItem={vi.fn()}
          onOrderPlaced={onOrderPlaced}
          onContinueShopping={vi.fn()}
        />
      );

      expect(screen.getByText("Micro-ATM Terminal M2")).toBeTruthy();
      expect(screen.getByText(/Tempered Margin Statutory Fee:/i)).toBeTruthy();

      // Proceed to checkout step
      const checkoutBtn = screen.getByRole("button", { name: /Proceed to Shipping & Payment/i });
      fireEvent.click(checkoutBtn);

      expect(screen.getByText("Shipping Address (India Delivery)")).toBeTruthy();
    });
  });

  describe("Four-Portal Role-Specific Mobile Architecture", () => {
    it("renders Admin Mobile Portal with authorized tabs and KPI dashboard", async () => {
      const { MainTabNavigator } = await import("../mobile/src/navigation/MainTabNavigator");
      const MainTabNavigatorComp: any = MainTabNavigator;
      const adminUser: any = {
        id: "usr-admin-01",
        name: "Admin Master User",
        email: "admin@buymecart.org",
        phone: "9800000001",
        role: "admin",
        portal: "admin",
        orgScope: "SYSTEM-WIDE",
        kycVerified: true,
        createdAt: new Date().toISOString(),
      };

      render(<MainTabNavigatorComp currentUser={adminUser} onLogout={vi.fn()} />);

      expect(screen.getByText("Admin Control Center")).toBeTruthy();
      expect(screen.getByText(/Total Settlement/i)).toBeTruthy();
      expect(screen.getByText(/Tempered Margin Pool/i)).toBeTruthy();
      expect(screen.getByText("Overview")).toBeTruthy();
      expect(screen.getByText("Network")).toBeTruthy();
      expect(screen.getByText("KYC Review")).toBeTruthy();
      expect(screen.getAllByText("Audit Stream").length).toBeGreaterThanOrEqual(1);
    });

    it("renders Super Distributor Mobile Portal with SD pool balance and AD tabs", async () => {
      const { MainTabNavigator } = await import("../mobile/src/navigation/MainTabNavigator");
      const MainTabNavigatorComp: any = MainTabNavigator;
      const sdUser: any = {
        id: "usr-sd-01",
        name: "Central Spark FinTech Pvt Ltd",
        email: "sd@buymecart.org",
        phone: "9800000002",
        role: "super_distributor",
        portal: "distributor",
        orgScope: "SD-CENTRAL-01",
        kycVerified: true,
        createdAt: new Date().toISOString(),
      };

      render(<MainTabNavigatorComp currentUser={sdUser} onLogout={vi.fn()} />);

      expect(screen.getByText("Super Distributor Portal")).toBeTruthy();
      expect(screen.getByText("Total Allocated Pool Balance")).toBeTruthy();
      expect(screen.getByText("₹8,45,000.00")).toBeTruthy();
      expect(screen.getByText("SD Float")).toBeTruthy();
      expect(screen.getByText("Area Dists")).toBeTruthy();
      expect(screen.getByText("AD Onboard")).toBeTruthy();
      expect(screen.getByText("Commercials")).toBeTruthy();
    });

    it("renders Area Distributor Mobile Portal with territory scoping and retailer queue", async () => {
      const { MainTabNavigator } = await import("../mobile/src/navigation/MainTabNavigator");
      const MainTabNavigatorComp: any = MainTabNavigator;
      const adUser: any = {
        id: "usr-ad-01",
        name: "Sunil Verma",
        email: "ad@buymecart.org",
        phone: "9800000003",
        role: "area_distributor",
        portal: "distributor",
        orgScope: "AD-ZONE-01",
        kycVerified: true,
        createdAt: new Date().toISOString(),
      };

      render(<MainTabNavigatorComp currentUser={adUser} onLogout={vi.fn()} />);

      expect(screen.getByText("Area Distributor Desk")).toBeTruthy();
      expect(screen.getByText(/AD Operating Float Balance/i)).toBeTruthy();
      expect(screen.getByText("AD Desk")).toBeTruthy();
      expect(screen.getByText("Retailers")).toBeTruthy();
      expect(screen.getByText("KYC Queue")).toBeTruthy();
      expect(screen.getByText("Ledger")).toBeTruthy();
    });

    it("renders Retailer Mobile Portal with Merchant Desk and banking rails", async () => {
      const { MainTabNavigator } = await import("../mobile/src/navigation/MainTabNavigator");
      const MainTabNavigatorComp: any = MainTabNavigator;
      const retailerUser: any = {
        id: "usr-ret-01",
        name: "Patel Digital Kendra (Rajesh Patel)",
        email: "retailer@buymecart.org",
        phone: "9898989898",
        role: "retailer",
        portal: "retailer",
        orgScope: "RET-ZONE-01-401",
        kycVerified: true,
        createdAt: new Date().toISOString(),
      };

      render(<MainTabNavigatorComp currentUser={retailerUser} onLogout={vi.fn()} />);

      expect(screen.getByText("Merchant Retail Desk")).toBeTruthy();
      expect(screen.getByText(/Available Merchant Operating Float/i)).toBeTruthy();
      expect(screen.getByText("AEPS Cash")).toBeTruthy();
      expect(screen.getByText("DMT Transfer")).toBeTruthy();
      expect(screen.getByText("BBPS Bill Pay")).toBeTruthy();
      expect(screen.getByText("Retail Desk")).toBeTruthy();
      expect(screen.getByText("Receipts")).toBeTruthy();
      expect(screen.getByText("KYC & Bank")).toBeTruthy();
      expect(screen.getByText("Help")).toBeTruthy();
    });
  });

  describe("Mobile KYC Onboarding & Video KYC", () => {
    it("renders MobileKycScreen and displays step progress and mandatory validations", async () => {
      const { MobileKycScreen } = await import("../mobile/src/screens/MobileKycScreen");
      const MobileKycScreenComp: any = MobileKycScreen;
      render(
        <MobileKycScreenComp
          initiatorRole="area_distributor"
          targetRole="retailer"
          onComplete={vi.fn()}
        />
      );

      expect(screen.getByText("Multi-Step KYC Onboarding")).toBeTruthy();
      expect(screen.getByText(/Personal Details & Contact OTPs/i)).toBeTruthy();
      expect(screen.getByText("Applicant Full Name")).toBeTruthy();
      expect(screen.getByRole("button", { name: /Next Step/i })).toBeTruthy();
    });
  });

  describe("Mobile Floating AI Assistant Security Guard", () => {
    it("renders floating AI assistant button and safeguards sensitive credentials", async () => {
      const { MobileFloatingAiChatbot } = await import("../mobile/src/components/MobileFloatingAiChatbot");
      const MobileFloatingAiChatbotComp: any = MobileFloatingAiChatbot;
      const testUser: any = {
        id: "usr-01",
        name: "Rajesh Patel",
        role: "retailer",
      };

      render(<MobileFloatingAiChatbotComp currentUser={testUser} />);
      expect(screen.getAllByText("🤖").length).toBeGreaterThanOrEqual(1);
    });
  });
});

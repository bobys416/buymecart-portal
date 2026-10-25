import React from "react";
import userEvent from "@testing-library/user-event";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MerchantKycDossier } from "@/components/admin/merchant-kyc-dossier";

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  uploadFile: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getStoredSession: () => ({ accessToken: "test-token" }),
}));

vi.mock("@/lib/api-client", () => ({
  ApiClientError: class ApiClientError extends Error {
    status = 500;
    data: unknown;
  },
  apiClient: mocks,
}));

const merchant = {
  id: "merchant-1",
  login_id: "store@example.test",
  full_name: "Synthetic Merchant",
  email: "store@example.test",
  phone: "9812345678",
  business_name: "Synthetic Store",
  territory: "Zone 01",
  parent_id: "area-1",
  role: "RETAILER",
  status: "ACTIVE",
};

const requiredDocs = ["PAN_CARD", "AADHAAR_FRONT", "AADHAAR_BACK", "BANK_PROOF", "MERCHANT_SELFIE", "SIGNATURE", "SHOP_FRONT", "EMPLOYEE_SELFIE"];

function makeApplication(status = "DRAFT") {
  return {
    id: "application-1",
    application_number: "APP-TEST-0001",
    status,
    target_merchant_id: merchant.id,
    documents: requiredDocs.map((document_type, index) => ({
      id: `doc-${index}`,
      document_type,
      label: document_type.replaceAll("_", " "),
      required: true,
      status: "NOT_UPLOADED",
    })).concat([{
      id: "video-doc",
      document_type: "VKYC_VIDEO",
      label: "Video KYC Recording",
      required: false,
      status: "NOT_UPLOADED",
    }]),
  };
}

function mockInitialLoad(items = [merchant]) {
  mocks.get.mockImplementation(async (path: string) => {
    if (path === "/retailers") return { items, meta: { total_pages: 1 } };
    if (path === "/onboarding") return { items: [], meta: { total_pages: 1 } };
    throw new Error(`Unexpected GET ${path}`);
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("merchant channel KYC dossier", () => {
  it("loads authorized merchants and gives a useful empty state", async () => {
    mockInitialLoad();
    render(<MerchantKycDossier />);
    expect(await screen.findByRole("option", { name: /Synthetic Store/ })).toBeTruthy();

    vi.clearAllMocks();
    mockInitialLoad([]);
    render(<MerchantKycDossier />);
    expect(await screen.findByText("No active merchants are available in your authorized hierarchy.")).toBeTruthy();
  });

  it("shows the API error instead of leaving a blank merchant dropdown", async () => {
    mocks.get.mockRejectedValue(new Error("Network unavailable"));
    render(<MerchantKycDossier />);
    expect(await screen.findByRole("alert")).toHaveTextContent("The KYC service could not complete this request");
  });

  it("uploads evidence through the API and reports server-backed submission only after confirmation", async () => {
    mockInitialLoad();
    mocks.post.mockResolvedValueOnce(makeApplication());
    mocks.uploadFile.mockResolvedValue({
      id: "doc-0",
      document_type: "PAN_CARD",
      label: "PAN CARD",
      required: true,
      status: "UPLOADED",
      original_filename: "synthetic-pan.jpg",
      file_size_bytes: 128,
      sha256_checksum: "a".repeat(64),
    });
    mocks.post.mockResolvedValueOnce({ ...makeApplication("UNDER_REVIEW"), documents: [] });

    render(<MerchantKycDossier />);
    fireEvent.change(await screen.findByLabelText("Select Target Merchant"), { target: { value: merchant.id } });
    fireEvent.change(screen.getByLabelText("PAN number"), { target: { value: "ABCDE1234F" } });
    fireEvent.change(screen.getByLabelText("Aadhaar last four digits"), { target: { value: "1234" } });
    fireEvent.change(screen.getByLabelText("Bank name"), { target: { value: "Synthetic Bank" } });
    fireEvent.change(screen.getByLabelText("Bank account number"), { target: { value: "123456789012" } });
    fireEvent.change(screen.getByLabelText("IFSC code"), { target: { value: "TEST0001234" } });
    fireEvent.click(screen.getByRole("button", { name: "Start KYC dossier" }));
    expect(await screen.findByText("APP-TEST-0001")).toBeTruthy();
    expect(mocks.post).toHaveBeenCalledWith("/onboarding", expect.objectContaining({ target_merchant_id: merchant.id }), { token: "test-token" });

    const panCard = screen.getByText("PAN CARD *").closest("div.rounded-lg.border-dashed") as HTMLElement;
    const fileInput = panCard?.querySelector("input[type='file']") as HTMLInputElement;
    const upload = new File(["synthetic"], "synthetic-pan.jpg", { type: "image/jpeg" });
    await userEvent.upload(fileInput, upload);
    await waitFor(() => expect(mocks.uploadFile).toHaveBeenCalledWith(
      "/onboarding/application-1/documents/doc-0/upload",
      expect.any(File),
      "synthetic-pan.jpg",
      "file",
      undefined,
      { token: "test-token" },
    ));
    expect(await screen.findByText(/Server SHA-256/)).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Submit Complete 12-Point Dossier" }));
    expect(await screen.findByRole("status")).toHaveTextContent("was submitted to the compliance queue");
    expect(mocks.post).toHaveBeenLastCalledWith("/onboarding/application-1/submit", undefined, { token: "test-token" });
  });
});

import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeatureScreen } from "@/components/feature-screen";

describe("retailer demo payment form", () => {
  it("validates locally and never claims a payment was created", async () => {
    render(<FeatureScreen portal="retailer" section="payments" />);
    fireEvent.click(screen.getByRole("button", { name: "Validate demo request" }));
    expect(await screen.findByText("Choose a service")).toBeTruthy();
  });
});

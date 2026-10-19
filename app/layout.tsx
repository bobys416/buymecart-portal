import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Buymecart | Operations portal",
  description: "Phase 1 frontend prototype - mock data only",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}

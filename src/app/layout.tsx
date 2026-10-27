import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "StockPilot — Inventory management for small businesses",
    template: "%s · StockPilot",
  },
  description:
    "Track products, suppliers, and every stock movement in one dependable inventory workspace. Transactional stock adjustments, low-stock alerts, and CSV reporting.",
  applicationName: "StockPilot",
  keywords: [
    "inventory management",
    "stock control",
    "warehouse",
    "small business",
    "suppliers",
  ],
  openGraph: {
    title: "StockPilot — Inventory management for small businesses",
    description:
      "A focused inventory workspace with an auditable stock ledger, reorder alerts, and reporting.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0b1220",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}

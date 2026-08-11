import type { Metadata, Viewport } from "next";
import { displayFont, monoFont, bodyFont } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "HH Goa 2026 — Builder ID Card Generator",
  description:
    "Generate your official Hacker House Goa 2026 Builder Pass in seconds. Upload a photo, customize your card, share it to X with #FrameInGoa.",
  icons: {
    icon: "/hhgoa.webp",
    shortcut: "/hhgoa.webp",
    apple: "/hhgoa.webp",
  },
  openGraph: {
    title: "Hacker Goa House 2026 — Builder ID Card",
    description: "Generate your official HH Goa 2026 Builder Pass. #FrameInGoa",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0d3320",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${displayFont.variable} ${monoFont.variable} ${bodyFont.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}

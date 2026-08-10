import { Syne, JetBrains_Mono, Inter } from "next/font/google";

// Syne 800 = the exact font used on hhgoa.com for "HACKER HOUSE" heading.
export const displayFont = Syne({
  subsets: ["latin"],
  weight: ["700", "800"],
  variable: "--font-display",
});

export const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-mono",
});

export const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
});

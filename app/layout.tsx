import type { Metadata, Viewport } from "next";
import { site } from "@/content/site";
import { sans, pixel, mono, momoSignature } from "./fonts";
import { NavPill } from "@/components/shell/NavPill";
import { Footer } from "@/components/shell/Footer";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { AsciiField } from "@/components/shell/AsciiField";
import { LoopGuard } from "@/components/shell/LoopGuard";
import { GoatCounter } from "@/components/shell/GoatCounter";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Parth Varekar — This page runs a machine",
    template: "%s — Parth Varekar",
  },
  description: site.description,
  keywords: [
    "Parth Varekar",
    "local-first AI",
    "WebLLM",
    "WebGPU",
    "portfolio",
    "machine learning",
    "Mumbai",
  ],
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: site.url,
    siteName: site.name,
    title: "Parth Varekar — This page runs a machine",
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Parth Varekar — This page runs a machine",
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export const viewport: Viewport = {
  themeColor: "#c8d1e1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${pixel.variable} ${mono.variable} ${momoSignature.variable}`}
    >
      <body>
        <AsciiField />
        <NavPill />
        <main id="main">{children}</main>
        <Footer />
        <CommandPalette />
        <LoopGuard />
        <GoatCounter />
      </body>
    </html>
  );
}

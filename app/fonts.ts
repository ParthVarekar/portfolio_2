import { GeistSans } from "geist/font/sans";
import { GeistPixelSquare } from "geist/font/pixel/square";
import { GeistMono } from "geist/font/mono";
import localFont from "next/font/local";

export const sans = GeistSans;
export const pixel = GeistPixelSquare;
export const mono = GeistMono;
export const momoSignature = localFont({
  src: "./fonts/MomoSignature.ttf",
  display: "swap",
  variable: "--font-momo-signature",
});

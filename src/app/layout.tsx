import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import { agencyName, noindex, site } from "@/lib/site";

// One subset file per family (Latin + Latin Extended-A, so Serbian needs no second file). Phones
// load these two and nothing else: the mono labels only exist above phone width (globals.css).
const Syne = localFont({ src: "../assets/fonts/syne-var.woff2", weight: "700 800", variable: "--font-syne", display: "swap" });
const Manrope = localFont({ src: "../assets/fonts/manrope-var.woff2", weight: "400 700", variable: "--font-manrope", display: "swap" });
const mono = IBM_Plex_Mono({ weight: "500", subsets: ["latin", "latin-ext"], variable: "--font-plex-mono", display: "swap", preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.legalName} | Car Detailing & Ceramic Coating in Dallas`, template: `%s | ${site.name}` },
  description:
    "Hand wash to paint correction and ceramic coating, in a lit studio in Dallas. Fixed prices by car size, done the same day, booked in a minute.",
  applicationName: site.legalName,
  creator: agencyName,
  formatDetection: { telephone: false },
  robots: noindex ? { index: false, follow: false, googleBot: { index: false, follow: false } } : { index: true, follow: true },
  openGraph: { type: "website", siteName: site.legalName, locale: "en_US" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#07080a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-US" className={`${Syne.variable} ${Manrope.variable} ${mono.variable}`}>
      <body className="min-h-dvh">
        {children}
        <SmoothScroll />
        <div className="grain" aria-hidden />
      </body>
    </html>
  );
}

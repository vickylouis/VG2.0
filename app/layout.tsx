import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import AppToaster from "@/components/ui/AppToaster";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = getSiteUrl();
const defaultTitle = "VG 2.0 — Becoming Vignesh 2.0";
const defaultDescription =
  "A 150-day public transformation of body, discipline, confidence and identity.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | VG 2.0",
  },
  description: defaultDescription,
  keywords: [
    "VG 2.0",
    "transformation",
    "fitness journey",
    "weight loss",
    "discipline",
    "150 day challenge",
  ],
  authors: [{ name: "Vignesh" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "VG 2.0",
    title: defaultTitle,
    description: defaultDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        "font-sans",
        inter.variable
      )}
    >
      <body className="min-h-full flex flex-col overflow-x-hidden">
        {children}
        <AppToaster />
      </body>
    </html>
  );
}

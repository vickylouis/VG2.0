import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import AppToaster from "@/components/ui/AppToaster";
import { getSiteUrl } from "@/lib/env";
import { getBranding, buildSiteTitle } from "@/lib/branding";
import { getConfig, resolveAppConfig } from "@/lib/settings";
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

export async function generateMetadata(): Promise<Metadata> {
  const [config, branding] = await Promise.all([getConfig(), getBranding()]);
  const { missionDays } = resolveAppConfig(config);
  const defaultTitle = buildSiteTitle(branding);
  const defaultDescription = `Track ${branding.userName}'s ${missionDays}-day transformation of body, discipline, confidence and identity.`;

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: defaultTitle,
      template: `%s | ${branding.brandName}`,
    },
    description: defaultDescription,
    keywords: [
      branding.brandName,
      "transformation",
      "fitness journey",
      "weight loss",
      "discipline",
      `${missionDays} day challenge`,
    ],
    authors: [{ name: branding.userName }],
    openGraph: {
      type: "website",
      locale: "en_US",
      url: siteUrl,
      siteName: branding.brandName,
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
}

export const dynamic = "force-dynamic";

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

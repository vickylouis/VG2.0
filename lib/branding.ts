import { resolveProfileConfig } from "@/lib/profileSettingsConfig";
import { getConfig } from "@/lib/settings";

export type Branding = {
  brandName: string;
  userName: string;
};

export async function getBranding(): Promise<Branding> {
  console.log("BRANDING LOAD");

  const config = await getConfig();
  const profile = resolveProfileConfig(config);

  const branding: Branding = {
    brandName: profile.missionName,
    userName: profile.name,
  };

  console.log("BRANDING APPLIED", branding);
  return branding;
}

export function buildSiteTitle(branding: Branding): string {
  return `${branding.brandName} — Becoming ${branding.userName}`;
}

export function buildAdminTitle(branding: Branding): string {
  return `${branding.brandName} Admin`;
}

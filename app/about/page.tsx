import AboutPlaceholder from "@/components/about/AboutPlaceholder";
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import { getAboutContent } from "@/lib/about";
import { getBranding } from "@/lib/branding";
import { getConfig, resolveAppConfig } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const branding = await getBranding();
  const config = await getConfig();
  const { missionDays } = resolveAppConfig(config);

  return {
    title: "About",
    description: `The mission behind ${branding.brandName} — a ${missionDays}-day public transformation of body, discipline, and identity.`,
  };
}

export default async function AboutPage() {
  const [config, branding] = await Promise.all([getConfig(), getBranding()]);
  const { missionDays } = resolveAppConfig(config);
  const content = getAboutContent(missionDays, branding);

  return (
    <PageShell maxWidth="4xl">
      <PageHeader
        eyebrow={content.eyebrow}
        title={content.title}
        description={content.description}
      />

      <AboutPlaceholder pillars={content.pillars} />
    </PageShell>
  );
}

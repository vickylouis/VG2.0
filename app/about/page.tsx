import AboutPlaceholder from "@/components/about/AboutPlaceholder";
import PageHeader from "@/components/layout/PageHeader";
import PageShell from "@/components/layout/PageShell";
import { getAboutContent } from "@/lib/about";

export const metadata = {
  title: "About",
  description:
    "The mission behind VG 2.0 — a 150-day public transformation of body, discipline, and identity.",
};

export default function AboutPage() {
  const content = getAboutContent();

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

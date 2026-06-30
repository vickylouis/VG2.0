import { Sparkles } from "lucide-react";
import ComingSoonCard from "@/components/layout/ComingSoonCard";
import type { AboutPillar } from "@/lib/about";
import { cn } from "@/lib/utils";

type AboutPlaceholderProps = {
  pillars: AboutPillar[];
};

export default function AboutPlaceholder({ pillars }: AboutPlaceholderProps) {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {pillars.map((pillar) => (
          <div
            key={pillar.title}
            className={cn(
              "rounded-2xl border border-[#D4AF37]/15 p-5",
              "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
              "shadow-[0_0_24px_rgba(212,175,55,0.06)] backdrop-blur-xl"
            )}
          >
            <p className="text-sm font-semibold text-[#D4AF37]">
              {pillar.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[#A3A3A3]">
              {pillar.description}
            </p>
          </div>
        ))}
      </div>

      <ComingSoonCard
        icon={Sparkles}
        message="The full About experience — story, mission timeline, and founder notes — is coming soon."
        action={{ label: "View Live Dashboard", href: "/#dashboard" }}
      />
    </div>
  );
}

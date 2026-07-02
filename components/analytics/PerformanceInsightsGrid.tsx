import { Brain, Moon, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PerformanceInsight } from "@/lib/analytics";

type PerformanceInsightsGridProps = {
  insights: PerformanceInsight[];
};

const INSIGHT_ICONS: Record<string, typeof Zap> = {
  "workout-score-delta": Zap,
  "sleep-score-delta": Moon,
  "strongest-score-correlation": Target,
};

const SENTIMENT_STYLES = {
  positive: "border-[#22C55E]/25 bg-[#22C55E]/5",
  negative: "border-[#EF4444]/25 bg-[#EF4444]/5",
  neutral: "border-[#D4AF37]/15 bg-[#0B0B0B]/50",
} as const;

export default function PerformanceInsightsGrid({
  insights,
}: PerformanceInsightsGridProps) {
  if (insights.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#D4AF37] uppercase">
          Performance Intelligence
        </h2>
        <div className="rounded-[24px] border border-[#D4AF37]/20 bg-[#171717] p-6 text-sm text-[#A3A3A3]">
          Log more days to unlock performance insights.
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#D4AF37] uppercase">
        Performance Intelligence
      </h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {insights.map((insight) => {
          const Icon = INSIGHT_ICONS[insight.id] ?? Brain;

          return (
            <article
              key={insight.id}
              className={cn(
                "rounded-[24px] border p-5 transition-all duration-300",
                "hover:border-[#D4AF37]/30 hover:shadow-[0_0_32px_rgba(212,175,55,0.08)]",
                SENTIMENT_STYLES[insight.sentiment]
              )}
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl border border-[#D4AF37]/25 bg-[#D4AF37]/10">
                  <Icon className="size-4 text-[#D4AF37]" aria-hidden />
                </div>
                <h3 className="text-base font-semibold text-[#F5F5F5]">
                  {insight.title}
                </h3>
              </div>
              <p className="text-sm leading-relaxed text-[#A3A3A3]">
                {insight.description}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}

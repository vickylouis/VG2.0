import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type InsightsCardProps = {
  insights: string[];
};

export default function InsightsCard({ insights }: InsightsCardProps) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-[24px] border border-[#D4AF37]/20 p-6 sm:p-8",
        "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
        "shadow-[0_0_32px_rgba(212,175,55,0.08)] backdrop-blur-xl",
        "transition-all duration-300 hover:border-[#D4AF37]/30 hover:shadow-[0_0_40px_rgba(212,175,55,0.12)]"
      )}
    >
      <div className="mb-6 flex items-center gap-3">
        <div
          className={cn(
            "flex size-11 items-center justify-center rounded-2xl",
            "border border-[#D4AF37]/25 bg-[#D4AF37]/10",
            "shadow-[0_0_20px_rgba(212,175,55,0.12)]"
          )}
        >
          <Sparkles className="size-5 text-[#D4AF37]" aria-hidden />
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#F5F5F5]">AI Insights</h3>
          <p className="text-sm text-[#A3A3A3]">
            Computed from your transformation data
          </p>
        </div>
      </div>

      {insights.length === 0 ? (
        <p className="text-sm text-[#A3A3A3]">
          Not enough data to generate insights yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {insights.map((insight) => (
            <li
              key={insight}
              className={cn(
                "flex gap-3 rounded-xl border border-[#D4AF37]/10",
                "bg-[#0B0B0B]/50 px-4 py-3 text-sm leading-relaxed text-[#F5F5F5]"
              )}
            >
              <span
                aria-hidden
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#D4AF37]"
              />
              {insight}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

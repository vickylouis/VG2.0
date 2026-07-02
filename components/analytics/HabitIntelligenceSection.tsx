import { Brain, TrendingDown, TrendingUp } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import type { HabitIntelligence } from "@/lib/analytics";

type HabitIntelligenceSectionProps = {
  intelligence: HabitIntelligence;
};

export default function HabitIntelligenceSection({
  intelligence,
}: HabitIntelligenceSectionProps) {
  const { habits, strongest, weakest } = intelligence;

  if (habits.length === 0) {
    return (
      <section>
        <h2 className="mb-4 text-sm font-semibold tracking-wide text-[#D4AF37] uppercase">
          Habit Intelligence
        </h2>
        <div className="rounded-[24px] border border-[#D4AF37]/20 bg-[#171717] p-6 text-sm text-[#A3A3A3]">
          Log habit check-ins to unlock completion analytics.
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h2 className="text-sm font-semibold tracking-wide text-[#D4AF37] uppercase">
        Habit Intelligence
      </h2>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {strongest ? (
          <StatCard
            icon={TrendingUp}
            title="Strongest Habit"
            value={`${strongest.completionPercent}%`}
            subtitle={strongest.label}
            trend={{
              text: "Highest completion rate",
              direction: "up",
            }}
          />
        ) : null}
        {weakest ? (
          <StatCard
            icon={TrendingDown}
            title="Weakest Habit"
            value={`${weakest.completionPercent}%`}
            subtitle={weakest.label}
            trend={{
              text: "Focus area for growth",
              direction: "neutral",
            }}
          />
        ) : null}
        <StatCard
          icon={Brain}
          title="Habits Tracked"
          value={`${habits.length}`}
          subtitle="From your dynamic habit config"
          trend={{
            text: "Completion across logged days",
            direction: "neutral",
          }}
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[#D4AF37]/15 bg-[#0B0B0B]/50">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#D4AF37]/15 bg-[#171717]/60">
                <th
                  scope="col"
                  className="px-4 py-3 text-xs font-semibold tracking-wide text-[#A3A3A3] uppercase"
                >
                  Habit
                </th>
                <th
                  scope="col"
                  className="px-4 py-3 text-xs font-semibold tracking-wide text-[#A3A3A3] uppercase"
                >
                  Completion %
                </th>
              </tr>
            </thead>
            <tbody>
              {habits.map((row) => (
                <tr
                  key={row.key}
                  className="border-b border-[#D4AF37]/10 transition-colors duration-200 last:border-b-0 hover:bg-[#D4AF37]/5"
                >
                  <td className="px-4 py-3.5 font-medium text-[#F5F5F5]">
                    {row.label}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-2 max-w-[200px] flex-1 overflow-hidden rounded-full bg-[#171717]">
                        <div
                          className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
                          style={{ width: `${row.completionPercent}%` }}
                        />
                      </div>
                      <span className="w-10 text-right font-semibold text-[#D4AF37]">
                        {row.completionPercent}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

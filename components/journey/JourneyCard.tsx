"use client";

import { motion } from "framer-motion";
import {
  Activity,
  Dumbbell,
  Footprints,
  Moon,
  Scale,
  UtensilsCrossed,
} from "lucide-react";
import type { JourneyEntry } from "@/lib/journey";
import { formatJourneyDate, formatMetricValue } from "@/lib/journey";
import { getVGScoreColor } from "@/lib/vgScore";
import { cn } from "@/lib/utils";

export type JourneyCardProps = {
  entry: JourneyEntry;
  index?: number;
};

function StatusBadge({
  label,
  active,
  activeLabel,
  inactiveLabel,
  variant,
}: {
  label: string;
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
  variant: "workout" | "cheat";
}) {
  const isPositive =
    variant === "workout" ? active : !active;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium",
        isPositive
          ? "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]"
          : "border-[#EF4444]/25 bg-[#EF4444]/10 text-[#EF4444]"
      )}
    >
      {variant === "workout" ? (
        <Dumbbell className="size-3" aria-hidden />
      ) : (
        <UtensilsCrossed className="size-3" aria-hidden />
      )}
      <span className="text-[#A3A3A3]">{label}:</span>
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

function MetricItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#D4AF37]/10 bg-[#0B0B0B]/50 px-4 py-3">
      <div className="flex items-center gap-2 text-xs text-[#A3A3A3]">
        <Icon className="size-3.5 text-[#D4AF37]" aria-hidden />
        {label}
      </div>
      <p className="mt-1.5 text-lg font-semibold text-[#F5F5F5]">{value}</p>
    </div>
  );
}

export default function JourneyCard({ entry, index = 0 }: JourneyCardProps) {
  const scoreReady = entry.vgScore != null;
  const scoreColor = getVGScoreColor(entry.vgScore ?? 0, scoreReady);

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.25 },
      }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-[#D4AF37]/20 p-6 sm:p-7",
        "bg-gradient-to-br from-[#171717]/95 via-[#0B0B0B]/98 to-[#171717]/85",
        "shadow-[0_0_32px_rgba(212,175,55,0.08)] backdrop-blur-xl",
        "transition-shadow duration-300",
        "hover:border-[#D4AF37]/40 hover:shadow-[0_12px_48px_rgba(212,175,55,0.18)]"
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-[#D4AF37]/6 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      />

      <header className="relative flex flex-wrap items-center justify-between gap-3 border-b border-[#D4AF37]/10 pb-5">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center rounded-full border border-[#D4AF37]/40",
              "bg-[#D4AF37]/10 px-4 py-1.5 text-sm font-bold tracking-wide text-[#D4AF37]",
              "shadow-[0_0_16px_rgba(212,175,55,0.15)]"
            )}
          >
            Day {entry.dayNumber}
          </span>
          <time
            dateTime={entry.date}
            className="text-sm font-medium text-[#A3A3A3]"
          >
            {formatJourneyDate(entry.date)}
          </time>
        </div>

        {scoreReady && (
          <div className="text-right">
            <p className="text-xs font-medium text-[#A3A3A3]">VG Score</p>
            <p
              className="text-2xl font-bold tracking-tight"
              style={{ color: scoreColor }}
            >
              {entry.vgScore}
              <span className="text-sm font-semibold text-[#A3A3A3]">/100</span>
            </p>
          </div>
        )}
      </header>

      <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricItem
          icon={Scale}
          label="Weight"
          value={formatMetricValue(entry.weight, " kg")}
        />
        <MetricItem
          icon={Activity}
          label="Waist"
          value={formatMetricValue(entry.waist, " in")}
        />
        <MetricItem
          icon={Footprints}
          label="Steps"
          value={formatMetricValue(entry.steps)}
        />
        <MetricItem
          icon={Moon}
          label="Sleep"
          value={formatMetricValue(entry.sleep_hours, " hrs")}
        />
      </div>

      <footer className="relative mt-5 space-y-4 border-t border-[#D4AF37]/10 pt-5">
        {entry.notes?.trim() ? (
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-[#D4AF37] uppercase">
              Notes
            </p>
            <p className="text-sm leading-relaxed text-[#A3A3A3]">
              {entry.notes}
            </p>
          </div>
        ) : (
          <p className="text-sm italic text-[#A3A3A3]/60">No notes for this day.</p>
        )}

        <div className="flex flex-wrap gap-2">
          <StatusBadge
            label="Workout"
            active={entry.workout_done}
            activeLabel="Done"
            inactiveLabel="Skipped"
            variant="workout"
          />
          <StatusBadge
            label="Cheat Meal"
            active={entry.cheat_meal}
            activeLabel="Yes"
            inactiveLabel="No"
            variant="cheat"
          />
        </div>
      </footer>
    </motion.article>
  );
}

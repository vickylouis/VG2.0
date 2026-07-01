"use client";

import { motion } from "framer-motion";
import { Brain, Target, Zap } from "lucide-react";
import type { JournalEntry } from "@/lib/journal";
import { formatJournalDate, formatJournalScore } from "@/lib/journal";
import { cn } from "@/lib/utils";

type JournalCardProps = {
  entry: JournalEntry;
  index?: number;
};

function ScoreItem({
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

function TextSection({
  title,
  content,
}: {
  title: string;
  content: string | null;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-wide text-[#D4AF37] uppercase">
        {title}
      </p>
      {content?.trim() ? (
        <p className="text-sm leading-relaxed text-[#A3A3A3]">{content}</p>
      ) : (
        <p className="text-sm italic text-[#A3A3A3]/60">No entry recorded.</p>
      )}
    </div>
  );
}

export default function JournalCard({ entry, index = 0 }: JournalCardProps) {
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

      <header className="relative border-b border-[#D4AF37]/10 pb-5">
        <time
          dateTime={entry.date}
          className="text-sm font-medium text-[#A3A3A3]"
        >
          {formatJournalDate(entry.date)}
        </time>
      </header>

      <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ScoreItem
          icon={Brain}
          label="Mood"
          value={formatJournalScore(entry.mood)}
        />
        <ScoreItem
          icon={Zap}
          label="Energy"
          value={formatJournalScore(entry.energy)}
        />
        <ScoreItem
          icon={Target}
          label="Discipline"
          value={formatJournalScore(entry.discipline)}
        />
      </div>

      <footer className="relative mt-5 space-y-4 border-t border-[#D4AF37]/10 pt-5">
        <TextSection title="Wins" content={entry.wins} />
        <TextSection title="Failures" content={entry.failures} />
        <TextSection title="Reflection" content={entry.reflection} />
      </footer>
    </motion.article>
  );
}

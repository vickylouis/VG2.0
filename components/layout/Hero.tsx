import Link from "next/link";
import { ArrowRight, User } from "lucide-react";
import { cn } from "@/lib/utils";

const cardStats = [
  { label: "Weight Lost", value: "0 kg" },
  { label: "Current Streak", value: "0 days" },
  { label: "Workouts", value: "0" },
  { label: "Completion", value: "0%" },
] as const;

function HeroBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-[#0B0B0B] via-[#0B0B0B] to-[#121212]" />
      <div className="absolute top-1/2 left-1/2 z-0 size-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4AF37]/8 blur-[140px]" />
      <div className="absolute top-20 right-1/4 z-0 size-[300px] rounded-full bg-[#D4AF37]/5 blur-[100px]" />
      <div className="absolute bottom-20 left-1/4 z-0 size-[250px] rounded-full bg-[#D4AF37]/4 blur-[80px]" />
      <div
        className="absolute inset-0 z-0 opacity-[0.035]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

function HeroVisualCard() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-[500px]">
      <div
        aria-hidden
        className="absolute -inset-4 z-0 rounded-[2rem] bg-[#D4AF37]/10 blur-2xl"
      />

      <div
        className={cn(
          "relative z-10 overflow-hidden rounded-3xl border border-[#D4AF37]/30",
          "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
          "p-6 shadow-[0_0_60px_rgba(212,175,55,0.12)] backdrop-blur-xl sm:p-8"
        )}
      >
        <div className="relative z-10 mb-6 inline-flex rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 px-4 py-1.5">
          <span className="text-xs font-semibold tracking-widest text-[#D4AF37] uppercase">
            Day 1 / 150
          </span>
        </div>

        <div className="relative z-10 mb-6">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-[#A3A3A3]">Progress</span>
            <span className="font-semibold text-[#D4AF37]">0%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#0B0B0B]">
            <div className="h-full w-0 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F5E6A3]" />
          </div>
        </div>

        <div className="relative z-10 mb-6 flex aspect-[4/5] items-center justify-center overflow-hidden rounded-2xl border border-[#D4AF37]/15 bg-gradient-to-b from-[#1a1a1a] to-[#0B0B0B]">
          <div className="flex flex-col items-center gap-3">
            <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-b from-[#D4AF37]/20 to-[#D4AF37]/5 ring-1 ring-[#D4AF37]/30">
              <User className="size-12 text-[#D4AF37]/60" strokeWidth={1.5} />
            </div>
            <p className="text-xs tracking-widest text-[#A3A3A3] uppercase">
              Transformation Preview
            </p>
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-3">
          {cardStats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-[#D4AF37]/10 bg-[#0B0B0B]/60 px-4 py-3"
            >
              <p className="text-xs text-[#A3A3A3]">{stat.label}</p>
              <p className="mt-1 text-sm font-semibold text-[#F5F5F5]">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroContent() {
  return (
    <div className="relative z-10 flex min-w-0 flex-col justify-center">
      <p className="relative z-10 mb-6 text-xs font-semibold tracking-[0.3em] text-[#D4AF37] uppercase">
        150 Day Public Transformation
      </p>

      <h1 className="relative z-10 text-4xl leading-[1.05] font-bold tracking-tight break-words text-[#F5F5F5] sm:text-5xl lg:text-6xl xl:text-7xl">
        150 DAYS.
        <br />
        ONE MISSION.
        <br />
        <span className="relative inline-block">
          <span
            aria-hidden
            className="absolute -inset-2 z-0 rounded-lg bg-[#D4AF37]/10 blur-xl"
          />
          <span className="relative z-10 text-[#D4AF37]">
            BECOMING
            <br />
            VIGNESH 2.0
          </span>
        </span>
      </h1>

      <p className="relative z-10 mt-6 text-xl font-medium text-[#D4AF37] sm:text-2xl">
        From invisible to undeniable.
      </p>

      <p className="relative z-10 mt-4 max-w-lg text-base leading-relaxed text-[#A3A3A3] sm:text-lg">
        A public transformation journey documenting the rebuilding of body,
        discipline, confidence and identity.
      </p>

      <div className="relative z-10 mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href="/#dashboard"
          className={cn(
            "inline-flex items-center gap-2 rounded-full bg-[#D4AF37] px-8 py-3.5",
            "text-sm font-semibold text-[#0B0B0B]",
            "shadow-[0_0_32px_rgba(212,175,55,0.25)]",
            "hover:shadow-[0_0_48px_rgba(212,175,55,0.4)]"
          )}
        >
          View Live Progress
          <ArrowRight className="size-4" aria-hidden />
        </Link>

        <Link
          href="/journey"
          className={cn(
            "inline-flex items-center gap-2 rounded-full border border-[#D4AF37] px-8 py-3.5",
            "text-sm font-semibold text-[#D4AF37]",
            "hover:bg-[#D4AF37]/10"
          )}
        >
          Follow Journey
        </Link>
      </div>
    </div>
  );
}

export default function Hero() {
  return (
    <section className="relative flex min-h-screen items-center overflow-hidden bg-[#0B0B0B] px-4 py-24 sm:px-6 lg:px-8">
      <HeroBackground />

      <div className="relative z-20 mx-auto grid w-full min-w-0 max-w-[1400px] grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <HeroContent />
        <HeroVisualCard />
      </div>
    </section>
  );
}

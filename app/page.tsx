import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/layout/Hero";
import StatCard from "@/components/dashboard/StatCard";
import WeightProgressChart from "@/components/charts/WeightProgressChart";
import type { StatCardTrend } from "@/components/dashboard/StatCard";
import { getDashboardStats, TOTAL_DAYS } from "@/lib/dashboard";
import { Calendar, Flame, Scale, Target } from "lucide-react";

export const dynamic = "force-dynamic";

function formatWeightLost(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(1)} kg`;
}

function buildStats(data: NonNullable<Awaited<ReturnType<typeof getDashboardStats>>["data"]>) {
  const dayTrend: StatCardTrend =
    data.day <= 1
      ? { text: "Mission started", direction: "neutral" }
      : { text: `${data.day} days in`, direction: "up" };

  const progressTrend: StatCardTrend =
    data.progress === 0
      ? { text: "Just getting started", direction: "neutral" }
      : { text: `${data.progress}% complete`, direction: "up" };

  const streakTrend: StatCardTrend =
    data.streak === 0
      ? { text: "Build momentum", direction: "neutral" }
      : { text: "On a roll", direction: "up" };

  const weightTrend: StatCardTrend =
    data.weightLost === 0
      ? { text: "Baseline set", direction: "neutral" }
      : { text: "Progress made", direction: "up" };

  return [
    {
      icon: Calendar,
      title: "Day",
      value: `${data.day}/${TOTAL_DAYS}`,
      subtitle: "Mission progress",
      trend: dayTrend,
    },
    {
      icon: Target,
      title: "Completion",
      value: `${data.progress}%`,
      subtitle: "Overall journey",
      trend: progressTrend,
    },
    {
      icon: Flame,
      title: "Current Streak",
      value: `${data.streak} ${data.streak === 1 ? "day" : "days"}`,
      subtitle: "Consecutive workout days",
      trend: streakTrend,
    },
    {
      icon: Scale,
      title: "Weight Lost",
      value: formatWeightLost(data.weightLost),
      subtitle: data.latestWeight
        ? `Current: ${data.latestWeight} kg`
        : "Since day one",
      trend: weightTrend,
    },
  ];
}

export default async function Home() {
  const { data, error } = await getDashboardStats();
  const stats = data ? buildStats(data) : [];

  return (
    <>
      <Navbar />
      <Hero />

      <section
        id="dashboard"
        className="scroll-mt-16 bg-[#0B0B0B] px-4 py-20 sm:px-6 lg:px-8"
      >
        <div className="mx-auto min-w-0 max-w-7xl">
          <div className="mb-10 text-center">
            <p className="text-xs font-medium tracking-[0.3em] text-[#D4AF37] uppercase">
              Live Progress
            </p>
            <h2 className="mt-2 text-3xl font-bold text-[#F5F5F5] sm:text-4xl">
              Dashboard
            </h2>
            <p className="mt-2 text-[#A3A3A3]">
              Your transformation at a glance
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mx-auto mb-8 max-w-2xl rounded-2xl border border-[#EF4444]/30 bg-[#171717] px-6 py-5 text-center"
            >
              <p className="font-medium text-[#EF4444]">
                Failed to load dashboard stats
              </p>
              <p className="mt-1 text-sm text-[#A3A3A3]">{error}</p>
            </div>
          )}

          {!error && stats.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <StatCard
                  key={stat.title}
                  icon={stat.icon}
                  title={stat.title}
                  value={stat.value}
                  subtitle={stat.subtitle}
                  trend={stat.trend}
                />
              ))}
            </div>
          )}

          <WeightProgressChart className="mt-8" />
        </div>
      </section>
    </>
  );
}

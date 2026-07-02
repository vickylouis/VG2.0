import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/layout/Hero";
import ChartSkeleton from "@/components/skeleton/ChartSkeleton";
import StatCardSkeleton from "@/components/skeleton/StatCardSkeleton";
import { SkeletonBone } from "@/components/skeleton/SkeletonBone";
import { getBranding } from "@/lib/branding";
import { getConfig, resolveAppConfig } from "@/lib/settings";

export default async function Loading() {
  const [branding, config] = await Promise.all([getBranding(), getConfig()]);
  const { missionDays } = resolveAppConfig(config);

  return (
    <>
      <Navbar brandName={branding.brandName} />
      <Hero missionDays={missionDays} missionName={branding.brandName} />

      <section
        id="dashboard"
        className="scroll-mt-16 bg-[#0B0B0B] px-4 py-20 sm:px-6 lg:px-8"
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <SkeletonBone className="mx-auto h-3 w-32" />
            <SkeletonBone className="mx-auto mt-3 h-10 w-48" />
            <SkeletonBone className="mx-auto mt-2 h-5 w-64 max-w-full" />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <StatCardSkeleton key={index} />
            ))}
          </div>

          <ChartSkeleton className="mt-8" />
        </div>
      </section>
    </>
  );
}

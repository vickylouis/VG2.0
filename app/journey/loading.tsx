import PageShell from "@/components/layout/PageShell";
import PageHeaderSkeleton from "@/components/skeleton/PageHeaderSkeleton";
import TimelineSkeleton from "@/components/skeleton/TimelineSkeleton";

export default function JourneyLoading() {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <TimelineSkeleton count={4} />
    </PageShell>
  );
}

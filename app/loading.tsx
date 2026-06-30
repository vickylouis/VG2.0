import Navbar from "@/components/layout/Navbar";

export default function Loading() {
  return (
    <>
      <Navbar />
      <div className="flex min-h-[50vh] items-center justify-center bg-[#0B0B0B] px-4 py-20">
        <div className="flex flex-col items-center gap-3 text-[#A3A3A3]">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37]/30 border-t-[#D4AF37]" />
          <p className="text-sm">Loading dashboard stats…</p>
        </div>
      </div>
    </>
  );
}

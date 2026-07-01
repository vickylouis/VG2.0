import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  maxWidth?: "3xl" | "4xl" | "7xl";
};

const maxWidthClasses = {
  "3xl": "max-w-3xl",
  "4xl": "max-w-4xl",
  "7xl": "max-w-7xl",
} as const;

export default function PageShell({
  children,
  className,
  contentClassName,
  maxWidth = "3xl",
}: PageShellProps) {
  return (
    <>
      <Navbar />

      <main
        className={cn(
          "relative min-h-screen overflow-x-hidden bg-[#0B0B0B] px-4 py-10 sm:px-6 lg:px-8",
          className
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute top-0 left-1/2 size-[700px] -translate-x-1/2 rounded-full bg-[#D4AF37]/8 blur-[160px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 size-[400px] translate-x-1/3 rounded-full bg-[#D4AF37]/5 blur-[120px]"
        />

        <div
          className={cn(
            "relative z-10 mx-auto min-w-0 w-full",
            maxWidthClasses[maxWidth],
            contentClassName
          )}
        >
          {children}
        </div>
      </main>

      <Footer />
    </>
  );
}

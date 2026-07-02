import { cn } from "@/lib/utils";

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description: string;
  className?: string;
  meta?: React.ReactNode;
};

export default function PageHeader({
  eyebrow,
  title,
  description,
  className,
  meta,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-10 min-w-0 text-center sm:text-left", className)}>
      {eyebrow ? (
        <p className="text-xs font-semibold tracking-[0.3em] text-[#D4AF37] uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={cn(
          "text-3xl font-bold break-words text-[#F5F5F5] sm:text-4xl",
          eyebrow ? "mt-2" : undefined
        )}
      >
        {title}
      </h1>
      <p className="mt-3 max-w-xl break-words text-[#A3A3A3]">{description}</p>
      {meta}
    </header>
  );
}

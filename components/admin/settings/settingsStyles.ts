import { cn } from "@/lib/utils";

export const settingsCardClassName = cn(
  "overflow-hidden rounded-[24px] border border-[#D4AF37]/20 p-6 sm:p-7",
  "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
  "shadow-[0_0_32px_rgba(212,175,55,0.08)] backdrop-blur-xl",
  "transition-all duration-300 hover:border-[#D4AF37]/30 hover:shadow-[0_0_40px_rgba(212,175,55,0.12)]"
);

export const settingsInputClassName = cn(
  "w-full rounded-xl border border-[#D4AF37]/20 bg-[#0B0B0B]/80 px-4 py-2.5",
  "text-sm text-[#F5F5F5] placeholder:text-[#A3A3A3]/50",
  "outline-none transition-all duration-300",
  "focus:border-[#D4AF37]/50 focus:shadow-[0_0_20px_rgba(212,175,55,0.12)]"
);

export const settingsLabelClassName =
  "mb-2 block text-sm font-medium text-[#A3A3A3]";

export const settingsEditButtonClassName = cn(
  "rounded-xl border border-[#D4AF37]/25 px-3.5 py-2 text-sm font-medium",
  "text-[#D4AF37] transition-all duration-300",
  "hover:border-[#D4AF37]/40 hover:bg-[#D4AF37]/10",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const settingsPrimaryButtonClassName = cn(
  "rounded-xl border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-3.5 py-2",
  "text-sm font-medium text-[#D4AF37] transition-all duration-300",
  "hover:bg-[#D4AF37]/25",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export const settingsSecondaryButtonClassName = cn(
  "rounded-xl border border-[#D4AF37]/15 px-3.5 py-2 text-sm font-medium",
  "text-[#A3A3A3] transition-all duration-300",
  "hover:border-[#D4AF37]/25 hover:text-[#F5F5F5]",
  "disabled:cursor-not-allowed disabled:opacity-50"
);

export function displaySettingValue(
  value: string | number | boolean | null | undefined
): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

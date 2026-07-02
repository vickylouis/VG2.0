"use client";

import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminTopbarProps = {
  onMenuClick: () => void;
  title: string;
};

export default function AdminTopbar({
  onMenuClick,
  title,
}: AdminTopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center justify-between",
        "border-b border-[#D4AF37]/10 bg-[#0B0B0B]/95 px-4 backdrop-blur-md lg:hidden"
      )}
    >
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open admin menu"
        className={cn(
          "inline-flex items-center justify-center rounded-lg p-2",
          "text-[#F5F5F5] transition-colors duration-300 hover:text-[#D4AF37]"
        )}
      >
        <Menu className="size-6" aria-hidden />
      </button>

      <p className="text-sm font-semibold text-[#F5F5F5]">{title}</p>

      <div className="size-10" aria-hidden />
    </header>
  );
}

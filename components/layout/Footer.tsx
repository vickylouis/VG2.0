import Link from "next/link";
import { cn } from "@/lib/utils";

const footerLinks = [
  { label: "Dashboard", href: "/#dashboard" },
  { label: "Journey", href: "/journey" },
  { label: "Gallery", href: "/gallery" },
  { label: "About", href: "/about" },
] as const;

export default function Footer() {
  return (
    <footer className="border-t border-[#D4AF37]/10 bg-[#0B0B0B] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
        <div className="text-center sm:text-left">
          <Link
            href="/"
            className="text-lg font-bold tracking-wide text-[#D4AF37] transition-opacity duration-300 hover:opacity-80"
          >
            VG 2.0
          </Link>
          <p className="mt-2 text-sm text-[#A3A3A3]">
            150 days. One mission. Becoming Vignesh 2.0.
          </p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {footerLinks.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className={cn(
                    "text-sm font-medium text-[#A3A3A3] transition-colors duration-300",
                    "hover:text-[#D4AF37]"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}

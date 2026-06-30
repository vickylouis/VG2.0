"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmpty = password.trim().length === 0;

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const adminSecret = process.env.NEXT_PUBLIC_ADMIN_SECRET;

    if (!adminSecret) {
      setError("Admin secret is not configured.");
      setIsSubmitting(false);
      return;
    }

    if (password === adminSecret) {
      router.push("/admin/dashboard");
      return;
    }

    setError("Invalid password");
    setIsSubmitting(false);
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0B0B0B] px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 left-1/2 size-[500px] -translate-x-1/2 rounded-full bg-[#D4AF37]/10 blur-[120px]"
      />

      <div
        className={cn(
          "relative w-full max-w-[420px] rounded-[24px] border border-[#D4AF37]/25 p-8",
          "bg-gradient-to-br from-[#171717]/90 via-[#0B0B0B]/95 to-[#171717]/80",
          "shadow-[0_0_40px_rgba(212,175,55,0.12)] backdrop-blur-xl sm:p-10"
        )}
      >
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex size-12 items-center justify-center rounded-2xl border border-[#D4AF37]/30 bg-[#D4AF37]/10">
            <Lock className="size-5 text-[#D4AF37]" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5]">VG 2.0 Admin Access</h1>
          <p className="mt-2 text-sm text-[#A3A3A3]">Enter admin password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="sr-only">
              Admin password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                placeholder="Password"
                autoComplete="current-password"
                className={cn(
                  "w-full rounded-xl border border-[#D4AF37]/20 bg-[#0B0B0B]/80 px-4 py-3 pr-12",
                  "text-[#F5F5F5] placeholder:text-[#A3A3A3]/60",
                  "outline-none transition-all duration-300",
                  "focus:border-[#D4AF37]/50 focus:shadow-[0_0_20px_rgba(212,175,55,0.15)]"
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[#A3A3A3] transition-colors duration-300 hover:text-[#D4AF37]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
          </div>

          {error && (
            <p role="alert" className="text-sm font-medium text-[#EF4444]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isEmpty || isSubmitting}
            className={cn(
              "w-full rounded-full bg-[#D4AF37] py-3.5 text-sm font-semibold text-[#0B0B0B]",
              "transition-all duration-300",
              "shadow-[0_0_24px_rgba(212,175,55,0.2)]",
              "hover:shadow-[0_0_36px_rgba(212,175,55,0.35)]",
              "disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
            )}
          >
            {isSubmitting ? "Signing in…" : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

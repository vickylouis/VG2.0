"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { signIn } from "@/lib/auth";
import { cn } from "@/lib/utils";

const inputClassName = cn(
  "w-full rounded-xl border border-[#D4AF37]/20 bg-[#0B0B0B]/80 px-4 py-3",
  "text-[#F5F5F5] placeholder:text-[#A3A3A3]/60",
  "outline-none transition-all duration-300",
  "focus:border-[#D4AF37]/50 focus:shadow-[0_0_20px_rgba(212,175,55,0.15)]"
);

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmpty = email.trim().length === 0 || password.trim().length === 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error("Invalid credentials");
      setIsSubmitting(false);
      return;
    }

    toast.success("Login successful");
    router.push(redirectTo);
    router.refresh();
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
          <h1 className="text-2xl font-bold text-[#F5F5F5]">VG 2.0 Admin</h1>
          <p className="mt-2 text-sm text-[#A3A3A3]">
            Sign in with your admin credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-[#A3A3A3]"
            >
              Email
            </label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-[#A3A3A3]"
                aria-hidden
              />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="email"
                required
                className={cn(inputClassName, "pl-10")}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-[#A3A3A3]"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                autoComplete="current-password"
                required
                className={cn(inputClassName, "pr-12")}
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
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

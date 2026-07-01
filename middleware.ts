import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ADMIN_LOGIN = "/admin/login";
const ADMIN_DASHBOARD = "/admin/dashboard";

const PROTECTED_ADMIN_ROUTES = [
  "/admin/dashboard",
  "/admin/gallery",
  "/admin/journal",
  "/admin/habits",
  "/admin/checkin",
  "/admin/analytics",
  "/admin/history",
] as const;

function isProtectedAdminRoute(pathname: string): boolean {
  return PROTECTED_ADMIN_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { supabaseResponse, user } = await updateSession(request);

  if (!pathname.startsWith("/admin")) {
    return supabaseResponse;
  }

  if (pathname === ADMIN_LOGIN) {
    if (user) {
      const url = request.nextUrl.clone();
      url.pathname = ADMIN_DASHBOARD;
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  if (pathname === "/admin") {
    const url = request.nextUrl.clone();
    url.pathname = user ? ADMIN_DASHBOARD : ADMIN_LOGIN;
    return NextResponse.redirect(url);
  }

  if (isProtectedAdminRoute(pathname) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_LOGIN;
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/login",
    "/admin/dashboard",
    "/admin/dashboard/:path*",
    "/admin/gallery",
    "/admin/gallery/:path*",
    "/admin/journal",
    "/admin/journal/:path*",
    "/admin/habits",
    "/admin/habits/:path*",
    "/admin/checkin",
    "/admin/checkin/:path*",
    "/admin/analytics",
    "/admin/analytics/:path*",
    "/admin/history",
    "/admin/history/:path*",
  ],
};

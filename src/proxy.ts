import { NextResponse, type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";
import { getSupabaseConfig } from "@/lib/supabase/config";

const protectedPrefixes = [
  "/dashboard",
  "/products",
  "/categories",
  "/suppliers",
  "/stock-movements",
  "/reports",
  "/settings",
];

const authRoutes = ["/login", "/signup"];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!getSupabaseConfig()) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);
  const isProtected = protectedPrefixes.some((prefix) =>
    matchesPrefix(pathname, prefix),
  );
  const isAuthRoute = authRoutes.includes(pathname);

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

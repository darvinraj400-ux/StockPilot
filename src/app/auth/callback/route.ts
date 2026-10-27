import { NextResponse, type NextRequest } from "next/server";

import { sanitizeRedirectPath } from "@/lib/redirects";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = sanitizeRedirectPath(url.searchParams.get("next"));
  const providerError =
    url.searchParams.get("error_description") ?? url.searchParams.get("error");

  if (providerError) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("That link is invalid or has expired. Sign in or request a new confirmation email.")}`,
        url.origin,
      ),
    );
  }

  if (!code || !isSupabaseConfigured()) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("That confirmation link is incomplete. Please try signing in.")}`,
        url.origin,
      ),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(
        `/login?error=${encodeURIComponent("We could not verify that link. It may have expired — sign in or request a new email.")}`,
        url.origin,
      ),
    );
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

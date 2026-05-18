import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export type SessionUpdateResult = {
  response: NextResponse;
  hasSession: boolean;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
// Supabase's default auth storage key is `sb-<project-ref>-auth-token`; the
// SSR helpers use the same convention unless a custom cookie name is supplied.
const supabaseSessionCookieName =
  supabaseUrl && URL.canParse(supabaseUrl)
    ? `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`
    : undefined;

function hasSupabaseSessionCookie(request: NextRequest): boolean {
  if (!supabaseSessionCookieName) {
    return false;
  }

  return request.cookies.getAll().some(({ name }) => {
    return name === supabaseSessionCookieName || name.startsWith(`${supabaseSessionCookieName}.`);
  });
}

export async function updateSession(request: NextRequest): Promise<SessionUpdateResult> {
  let response = NextResponse.next({ request });
  const hasSessionCookie = hasSupabaseSessionCookie(request);

  // Skip Supabase auth refresh entirely when the request has no session cookie
  // or the edge runtime does not have the public client config available.
  if (!hasSessionCookie || !supabaseUrl || !supabaseAnonKey) {
    return {
      response,
      hasSession: hasSessionCookie,
    };
  }

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    return {
      response,
      hasSession: Boolean(user),
    };
  } catch {
    return {
      response,
      hasSession: hasSessionCookie,
    };
  }
}

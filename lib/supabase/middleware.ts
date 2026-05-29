import { createServerClient } from "@supabase/ssr";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger } from "@/lib/observability";

export type SessionUpdateResult = {
  response: NextResponse;
  hasSession: boolean;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
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
  const hasSessionCookie = hasSupabaseSessionCookie(request);
  let response = NextResponse.next({ request });

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
  } catch (error) {
    logger.warn("updateSession failed; using the existing session cookie state", {
      category: "error",
      service: "supabase",
      error: { message: error instanceof Error ? error.message : String(error), name: "SupabaseSessionRefreshWarning" },
    });

    return {
      response,
      hasSession: hasSessionCookie,
    };
  }
}

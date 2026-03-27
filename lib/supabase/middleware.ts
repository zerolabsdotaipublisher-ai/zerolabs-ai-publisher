import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { config } from "@/config";

export type SessionUpdateResult = {
  response: NextResponse;
  user: User | null;
};

export async function updateSession(request: NextRequest): Promise<SessionUpdateResult> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(config.services.supabase.url, config.services.supabase.anonKey, {
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
    user,
  };
}

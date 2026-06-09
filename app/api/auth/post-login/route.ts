import { NextResponse } from "next/server";
import { routes } from "@/config/routes";
import { resolvePostLoginRedirectPath, sanitizeNextPath } from "@/lib/auth/redirect";
import { createFallbackProfile, getSafeProfile } from "@/lib/supabase/profile";
import { getServerUser } from "@/lib/supabase/server";

function buildLoginUrl(requestUrl: string, nextPath: string | null): URL {
  const loginUrl = new URL(routes.login, requestUrl);

  if (nextPath) {
    loginUrl.searchParams.set("next", nextPath);
  }

  return loginUrl;
}

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const nextPath = sanitizeNextPath(requestUrl.searchParams.get("next"));
  const user = await getServerUser();

  if (!user) {
    return NextResponse.redirect(buildLoginUrl(request.url, nextPath));
  }

  const profile = await getSafeProfile(user).catch(() => createFallbackProfile(user));
  const destination = resolvePostLoginRedirectPath(nextPath, profile.role === "admin");

  return NextResponse.redirect(new URL(destination, request.url));
}

import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { routes } from "@/config/routes";
import { syncProfileFromAuthUser } from "@/lib/supabase/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSafeNextPath } from "@/lib/auth/redirect";

const EMAIL_OTP_TYPES = new Set<EmailOtpType>(["signup", "invite", "magiclink", "recovery", "email", "email_change"]);

function resolveEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value || !EMAIL_OTP_TYPES.has(value as EmailOtpType)) {
    return null;
  }

  return value as EmailOtpType;
}

function buildLoginUrl(requestUrl: string, searchParams?: Record<string, string>): URL {
  const loginUrl = new URL(routes.login, requestUrl);

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    loginUrl.searchParams.set(key, value);
  }

  return loginUrl;
}

export async function GET(request: Request): Promise<NextResponse> {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = resolveEmailOtpType(requestUrl.searchParams.get("type"));
  const nextParam = requestUrl.searchParams.get("next");
  const requestedNext = resolveSafeNextPath(nextParam);
  const next = nextParam ? requestedNext : routes.login;

  if (!code && !(tokenHash && otpType)) {
    return NextResponse.redirect(buildLoginUrl(request.url));
  }

  const supabase = await getSupabaseServerClient();
  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({
        token_hash: tokenHash as string,
        type: otpType as EmailOtpType,
      });

  if (error) {
    return NextResponse.redirect(buildLoginUrl(request.url, { error: "callback_failed" }));
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await syncProfileFromAuthUser(user);
  }

  if (next === routes.login) {
    // Supabase verification creates a session; sign out so the login screen can show the verified state first.
    await supabase.auth.signOut();
    return NextResponse.redirect(buildLoginUrl(request.url, { verified: "1" }));
  }

  return NextResponse.redirect(new URL(next, request.url));
}

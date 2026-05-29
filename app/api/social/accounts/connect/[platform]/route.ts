import { NextResponse, type NextRequest } from "next/server";
import { beginSocialAccountConnection, requireSocialAccountPlatform, SocialAccountError } from "@/lib/social/accounts";
import { normalizeSafeOAuthReturnTo } from "@/lib/social/accounts/redirect";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ platform: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { platform: platformParam } = await params;
    const platform = requireSocialAccountPlatform(platformParam);
    const returnTo = normalizeSafeOAuthReturnTo(request.nextUrl.searchParams.get("returnTo"), request.nextUrl.origin);

    const result = await beginSocialAccountConnection({
      userId: user.id,
      platform,
      returnTo,
    });

    return NextResponse.redirect(result.authorizeUrl);
  } catch (error) {
    const normalized =
      error instanceof SocialAccountError
        ? error
        : new SocialAccountError(error instanceof Error ? error.message : "Unable to start OAuth flow.", {
            code: "social_account_connect_failed",
            statusCode: 500,
          });

    return NextResponse.json({ ok: false, error: normalized.message, code: normalized.code }, { status: normalized.statusCode });
  }
}

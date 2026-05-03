import { type NextRequest, NextResponse } from "next/server";
import {
  assertOAuthCallbackInput,
  finalizeSocialAccountCallback,
  getOwnedSocialAccountConnectionByPlatform,
  markSocialAccountStatus,
  requireSocialAccountPlatform,
  SocialAccountError,
} from "@/lib/social/accounts";
import { appendOAuthRedirectState } from "@/lib/social/accounts/redirect";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ platform: string }>;
}

export async function GET(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let platform;
  try {
    const { platform: platformParam } = await params;
    platform = requireSocialAccountPlatform(platformParam);
  } catch (error) {
    const normalized =
      error instanceof SocialAccountError
        ? error
        : new SocialAccountError("Unsupported social account provider.", {
            code: "social_account_provider_unsupported",
            statusCode: 422,
          });
    return NextResponse.json({ ok: false, error: normalized.message, code: normalized.code }, { status: normalized.statusCode });
  }

  const existing = await getOwnedSocialAccountConnectionByPlatform(user.id, platform);
  const returnTo =
    typeof existing?.metadata.oauthReturnTo === "string" && existing.metadata.oauthReturnTo
      ? existing.metadata.oauthReturnTo
      : undefined;

  const deniedError =
    request.nextUrl.searchParams.get("error_description") ?? request.nextUrl.searchParams.get("error");
  if (deniedError) {
    if (existing) {
      await markSocialAccountStatus({
        accountId: existing.id,
        userId: user.id,
        status: "reauthorization_required",
        reauthorizationRequired: true,
        errorMessage: deniedError,
      });
    }

    const redirectUrl = appendOAuthRedirectState(returnTo, "socialAccountError", deniedError);
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.json(
      { ok: false, error: deniedError, code: "social_account_oauth_permission_denied" },
      { status: 400 },
    );
  }

  try {
    const payload = assertOAuthCallbackInput({
      code: request.nextUrl.searchParams.get("code"),
      state: request.nextUrl.searchParams.get("state"),
    });

    const connection = await finalizeSocialAccountCallback({
      userId: user.id,
      platform,
      code: payload.code,
      state: payload.state,
    });

    const redirectUrl = appendOAuthRedirectState(returnTo, "socialAccountConnected", connection.platform);
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.json({ ok: true, connection });
  } catch (error) {
    const normalized =
      error instanceof SocialAccountError
        ? error
        : new SocialAccountError(error instanceof Error ? error.message : "Social account callback failed.", {
            code: "social_account_callback_failed",
            statusCode: 500,
          });

    if (existing) {
      await markSocialAccountStatus({
        accountId: existing.id,
        userId: user.id,
        status: "reauthorization_required",
        reauthorizationRequired: true,
        errorMessage: normalized.message,
      });
    }

    const redirectUrl = appendOAuthRedirectState(returnTo, "socialAccountError", normalized.message);
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.json({ ok: false, error: normalized.message, code: normalized.code }, { status: normalized.statusCode });
  }
}

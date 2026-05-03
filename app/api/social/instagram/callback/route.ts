import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/observability";
import {
  assertOAuthCallbackInput,
  finalizeSocialAccountCallback,
  getOwnedSocialAccountConnectionByPlatform,
  markSocialAccountStatus,
  SocialAccountError,
} from "@/lib/social/accounts";
import { appendOAuthRedirectState } from "@/lib/social/accounts/redirect";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const existing = await getOwnedSocialAccountConnectionByPlatform(user.id, "instagram");
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

    return NextResponse.json({ ok: false, error: deniedError }, { status: 400 });
  }

  try {
    const payload = assertOAuthCallbackInput({
      code: request.nextUrl.searchParams.get("code"),
      state: request.nextUrl.searchParams.get("state"),
    });

    const connection = await finalizeSocialAccountCallback({
      userId: user.id,
      platform: "instagram",
      code: payload.code,
      state: payload.state,
    });

    const redirectUrl = appendOAuthRedirectState(returnTo, "socialAccountConnected", connection.platform);
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.json({ ok: true, connection });
  } catch (callbackError) {
    const normalized =
      callbackError instanceof SocialAccountError
        ? callbackError
        : new SocialAccountError(callbackError instanceof Error ? callbackError.message : "Instagram callback failed.", {
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

    logger.error("Instagram callback handling failed", {
      category: "error",
      service: "instagram",
      userId: user.id,
      error: {
        name: "InstagramCallbackError",
        message: normalized.message,
      },
    });

    const redirectUrl = appendOAuthRedirectState(returnTo, "socialAccountError", normalized.message);
    if (redirectUrl) {
      return NextResponse.redirect(redirectUrl);
    }

    return NextResponse.json(
      { ok: false, error: normalized.message, code: normalized.code },
      { status: normalized.statusCode },
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/observability";
import {
  completeInstagramConnection,
  DEFAULT_INSTAGRAM_SCOPES,
  exchangeCodeForMetaAccessToken,
  getInstagramBusinessAccountFromPages,
} from "@/lib/social/instagram";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const error = request.nextUrl.searchParams.get("error_description") ?? request.nextUrl.searchParams.get("error");
  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  if (!code || !state) {
    return NextResponse.json({ ok: false, error: "OAuth callback is missing code or state." }, { status: 400 });
  }

  try {
    const token = await exchangeCodeForMetaAccessToken(code);
    const accounts = await getInstagramBusinessAccountFromPages(token.access_token);
    const expiresAt = token.expires_in
      ? new Date(Date.now() + token.expires_in * 1000).toISOString()
      : undefined;

    const connection = await completeInstagramConnection({
      userId: user.id,
      state,
      scopes: [...DEFAULT_INSTAGRAM_SCOPES],
      accessToken: token.access_token,
      tokenExpiresAt: expiresAt,
      instagramAccountId: accounts.instagramAccountId,
      instagramUsername: accounts.instagramUsername,
      facebookPageId: accounts.facebookPageId,
    });

    return NextResponse.json({ ok: true, connection });
  } catch (callbackError) {
    logger.error("Instagram callback handling failed", {
      category: "error",
      service: "instagram",
      userId: user.id,
      error: {
        name: "InstagramCallbackError",
        message: callbackError instanceof Error ? callbackError.message : "Unknown error",
      },
    });

    return NextResponse.json(
      { ok: false, error: callbackError instanceof Error ? callbackError.message : "Instagram callback failed." },
      { status: 500 },
    );
  }
}

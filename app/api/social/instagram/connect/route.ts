import { NextResponse } from "next/server";
import {
  buildInstagramOAuthAuthorizeUrl,
  createInstagramOAuthState,
  DEFAULT_INSTAGRAM_SCOPES,
  setInstagramConnectionConnecting,
} from "@/lib/social/instagram";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const oauthState = createInstagramOAuthState();
  await setInstagramConnectionConnecting({
    userId: user.id,
    state: oauthState.state,
    expiresAt: oauthState.expiresAt,
    scopes: [...DEFAULT_INSTAGRAM_SCOPES],
  });

  const redirectUrl = buildInstagramOAuthAuthorizeUrl(oauthState.state);
  return NextResponse.redirect(redirectUrl);
}

import { type NextRequest, NextResponse } from "next/server";
import { beginSocialAccountConnection } from "@/lib/social/accounts";
import { normalizeSafeOAuthReturnTo } from "@/lib/social/accounts/redirect";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const returnTo = normalizeSafeOAuthReturnTo(request.nextUrl.searchParams.get("returnTo"), request.nextUrl.origin);
  const result = await beginSocialAccountConnection({
    userId: user.id,
    platform: "instagram",
    returnTo,
  });
  return NextResponse.redirect(result.authorizeUrl);
}

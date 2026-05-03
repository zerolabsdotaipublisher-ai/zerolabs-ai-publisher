import { type NextRequest, NextResponse } from "next/server";
import { beginSocialAccountConnection } from "@/lib/social/accounts";
import { getServerUser } from "@/lib/supabase/server";

function normalizeSafeReturnTo(raw: string | null, requestOrigin: string): string | undefined {
  if (!raw) return undefined;
  try {
    const parsed = new URL(raw, requestOrigin);
    if (parsed.origin !== requestOrigin) {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const returnTo = normalizeSafeReturnTo(request.nextUrl.searchParams.get("returnTo"), request.nextUrl.origin);
  const result = await beginSocialAccountConnection({
    userId: user.id,
    platform: "instagram",
    returnTo,
  });
  return NextResponse.redirect(result.authorizeUrl);
}

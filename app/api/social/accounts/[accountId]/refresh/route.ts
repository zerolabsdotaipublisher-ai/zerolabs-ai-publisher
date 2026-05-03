import { NextResponse } from "next/server";
import { refreshSocialAccountConnection, SocialAccountError } from "@/lib/social/accounts";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ accountId: string }>;
}

export async function POST(_request: Request, { params }: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { accountId } = await params;

  try {
    const account = await refreshSocialAccountConnection(accountId, user.id);
    return NextResponse.json({ ok: true, account });
  } catch (error) {
    const normalized =
      error instanceof SocialAccountError
        ? error
        : new SocialAccountError(error instanceof Error ? error.message : "Unable to refresh social account token.", {
            code: "social_account_refresh_failed",
            statusCode: 500,
          });

    return NextResponse.json({ ok: false, error: normalized.message, code: normalized.code }, { status: normalized.statusCode });
  }
}

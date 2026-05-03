import { NextResponse } from "next/server";
import { getSocialAccountConnection } from "@/lib/social/accounts";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ accountId: string }>;
}

export async function GET(_request: Request, { params }: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { accountId } = await params;
  const account = await getSocialAccountConnection(accountId, user.id);
  if (!account) {
    return NextResponse.json({ ok: false, error: "Social account not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, account });
}

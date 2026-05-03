import { NextResponse } from "next/server";
import { listSocialAccountProviders } from "@/lib/social/accounts";
import { listSocialAccountConnections } from "@/lib/social/accounts/workflow";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const [accounts, providers] = await Promise.all([
    listSocialAccountConnections(user.id),
    Promise.resolve(listSocialAccountProviders()),
  ]);

  return NextResponse.json({
    ok: true,
    accounts,
    providers,
  });
}

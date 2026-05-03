import { NextResponse } from "next/server";
import {
  disconnectSocialAccountConnection,
  getOwnedSocialAccountConnectionByPlatform,
} from "@/lib/social/accounts";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const account = await getOwnedSocialAccountConnectionByPlatform(user.id, "instagram");
  if (!account) {
    return NextResponse.json({ ok: false, error: "Instagram account is not connected." }, { status: 404 });
  }

  await disconnectSocialAccountConnection(account.id, user.id);
  return NextResponse.json({ ok: true });
}

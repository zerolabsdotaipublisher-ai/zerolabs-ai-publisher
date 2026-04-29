import { NextResponse } from "next/server";
import { disconnectInstagramConnection } from "@/lib/social/instagram";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  await disconnectInstagramConnection(user.id);
  return NextResponse.json({ ok: true });
}

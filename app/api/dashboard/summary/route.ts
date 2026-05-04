import { NextResponse } from "next/server";
import { buildDashboardSummary, getDefaultDashboardErrorMessage } from "@/lib/dashboard";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await buildDashboardSummary({
      userId: user.id,
      email: user.email ?? "",
      displayName: typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : undefined,
    });

    return NextResponse.json({ ok: true, summary });
  } catch {
    return NextResponse.json({ ok: false, error: getDefaultDashboardErrorMessage() }, { status: 500 });
  }
}

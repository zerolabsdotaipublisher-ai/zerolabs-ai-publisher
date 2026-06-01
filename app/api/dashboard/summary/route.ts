import { NextResponse } from "next/server";
import { buildDashboardSummary, getDefaultDashboardErrorMessage } from "@/lib/dashboard";
import { getProfileDisplayName, getSafeProfile } from "@/lib/supabase/profile";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await getSafeProfile(user);
    const summary = await buildDashboardSummary({
      userId: user.id,
      email: user.email ?? "",
      displayName: getProfileDisplayName(profile),
    });

    return NextResponse.json({ ok: true, summary });
  } catch {
    return NextResponse.json({ ok: false, error: getDefaultDashboardErrorMessage() }, { status: 500 });
  }
}

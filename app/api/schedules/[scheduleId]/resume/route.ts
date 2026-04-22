import { NextResponse } from "next/server";
import { resumeOwnedContentSchedule } from "@/lib/scheduling";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ scheduleId: string }>;
}

export async function POST(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { scheduleId } = await params;

  try {
    const schedule = await resumeOwnedContentSchedule(scheduleId, user.id);
    if (!schedule) {
      return NextResponse.json({ ok: false, error: "Schedule not found" }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      schedule,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resume schedule";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }
}

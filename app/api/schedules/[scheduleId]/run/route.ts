import { NextResponse } from "next/server";
import {
  executeContentScheduleNow,
  getOwnedContentScheduleById,
} from "@/lib/scheduling";
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
  const schedule = await getOwnedContentScheduleById(scheduleId, user.id);
  if (!schedule) {
    return NextResponse.json({ ok: false, error: "Schedule not found" }, { status: 404 });
  }

  try {
    const result = await executeContentScheduleNow(schedule.id);
    return NextResponse.json({
      ok: true,
      result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run schedule";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }
}

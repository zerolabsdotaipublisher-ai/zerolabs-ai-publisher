import { NextResponse } from "next/server";
import {
  cancelOwnedSocialSchedule,
  getOwnedSocialScheduleById,
  listOwnedSocialScheduleEvents,
  listOwnedSocialScheduleRuns,
  updateOwnedSocialSchedule,
  type SocialScheduleUpsertInput,
} from "@/lib/social/scheduling";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ scheduleId: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { scheduleId } = await params;
  const schedule = await getOwnedSocialScheduleById(scheduleId, user.id);
  if (!schedule) {
    return NextResponse.json({ ok: false, error: "Schedule not found" }, { status: 404 });
  }

  const [runs, events] = await Promise.all([
    listOwnedSocialScheduleRuns(schedule.id, user.id, 10),
    listOwnedSocialScheduleEvents(schedule.id, user.id, 10),
  ]);

  return NextResponse.json({ ok: true, schedule, runs, events });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { scheduleId } = await params;
  let body: Partial<SocialScheduleUpsertInput>;
  try {
    body = (await request.json()) as Partial<SocialScheduleUpsertInput>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const schedule = await updateOwnedSocialSchedule(scheduleId, user.id, body);
    if (!schedule) {
      return NextResponse.json({ ok: false, error: "Schedule not found" }, { status: 404 });
    }

    const [runs, events] = await Promise.all([
      listOwnedSocialScheduleRuns(schedule.id, user.id, 10),
      listOwnedSocialScheduleEvents(schedule.id, user.id, 10),
    ]);

    return NextResponse.json({ ok: true, schedule, runs, events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update social schedule";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { scheduleId } = await params;
  const schedule = await getOwnedSocialScheduleById(scheduleId, user.id);
  if (!schedule) {
    return NextResponse.json({ ok: false, error: "Schedule not found" }, { status: 404 });
  }

  const canceled = await cancelOwnedSocialSchedule(scheduleId, user.id);

  return NextResponse.json({ ok: true, schedule: canceled });
}

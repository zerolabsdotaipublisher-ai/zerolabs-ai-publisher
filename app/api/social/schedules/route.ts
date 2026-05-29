import { type NextRequest, NextResponse } from "next/server";
import {
  listOwnedSocialScheduleEvents,
  listOwnedSocialScheduleRuns,
  listOwnedSocialSchedules,
  upsertOwnedSocialSchedule,
  type SocialScheduleUpsertInput,
} from "@/lib/social/scheduling";
import { getSocialPostById } from "@/lib/social/storage";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const structureId = request.nextUrl.searchParams.get("structureId") ?? undefined;
  const socialPostId = request.nextUrl.searchParams.get("socialPostId") ?? undefined;

  const schedules = await listOwnedSocialSchedules(user.id, {
    structureId,
    socialPostId,
  });

  const withDetails = await Promise.all(
    schedules.map(async (schedule) => ({
      ...schedule,
      runs: await listOwnedSocialScheduleRuns(schedule.id, user.id, 10),
      events: await listOwnedSocialScheduleEvents(schedule.id, user.id, 10),
    })),
  );

  return NextResponse.json({
    ok: true,
    schedules: withDetails,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: SocialScheduleUpsertInput;
  try {
    body = (await request.json()) as SocialScheduleUpsertInput;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.socialPostId?.trim()) {
    return NextResponse.json({ ok: false, error: "socialPostId is required" }, { status: 400 });
  }

  const post = await getSocialPostById(body.socialPostId, user.id);
  if (!post) {
    return NextResponse.json({ ok: false, error: "Social post not found" }, { status: 404 });
  }

  try {
    const schedule = await upsertOwnedSocialSchedule(body, user.id);
    const runs = await listOwnedSocialScheduleRuns(schedule.id, user.id, 10);
    const events = await listOwnedSocialScheduleEvents(schedule.id, user.id, 10);

    return NextResponse.json({
      ok: true,
      socialPostId: post.id,
      schedule,
      runs,
      events,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save social schedule";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }
}

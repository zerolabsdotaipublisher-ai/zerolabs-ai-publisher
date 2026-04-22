import { type NextRequest, NextResponse } from "next/server";
import {
  getOwnedContentScheduleByStructureId,
  getOwnedStructureForSchedule,
  listOwnedContentScheduleRuns,
  upsertOwnedContentSchedule,
  type ContentScheduleUpsertInput,
} from "@/lib/scheduling";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const structureId = request.nextUrl.searchParams.get("structureId");
  if (!structureId?.trim()) {
    return NextResponse.json({ ok: false, error: "structureId is required" }, { status: 400 });
  }

  const schedule = await getOwnedContentScheduleByStructureId(structureId, user.id);
  if (!schedule) {
    return NextResponse.json({ ok: true, schedule: null, runs: [] });
  }

  const runs = await listOwnedContentScheduleRuns(schedule.id, user.id, 10);
  return NextResponse.json({
    ok: true,
    schedule,
    runs,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: ContentScheduleUpsertInput;
  try {
    body = (await request.json()) as ContentScheduleUpsertInput;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim()) {
    return NextResponse.json({ ok: false, error: "structureId is required" }, { status: 400 });
  }

  const structure = await getOwnedStructureForSchedule(body.structureId, user.id);
  if (!structure) {
    return NextResponse.json({ ok: false, error: "Website structure not found" }, { status: 404 });
  }

  try {
    const schedule = await upsertOwnedContentSchedule(structure, body);
    const runs = await listOwnedContentScheduleRuns(schedule.id, user.id, 10);
    return NextResponse.json({
      ok: true,
      schedule,
      runs,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save content schedule";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }
}

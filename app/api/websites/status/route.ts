import { type NextRequest, NextResponse } from "next/server";
import {
  activateWebsite,
  archiveWebsite,
  toWebsiteManagementRecord,
  validateWebsiteOwnership,
  saveOwnedWebsiteStructure,
  type WebsiteStatusPayload,
} from "@/lib/management";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: WebsiteStatusPayload;
  try {
    body = (await request.json()) as WebsiteStatusPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim() || !body.status) {
    return NextResponse.json({ ok: false, error: "structureId and status are required" }, { status: 400 });
  }

  if (body.status !== "archive" && body.status !== "activate") {
    return NextResponse.json({ ok: false, error: "status must be archive or activate" }, { status: 400 });
  }

  try {
    const ownership = await validateWebsiteOwnership(body.structureId, user.id);
    if (!ownership.owned || !ownership.website) {
      return NextResponse.json({ ok: false, error: "Website not found" }, { status: 404 });
    }

    if (ownership.website.management?.deletedAt) {
      return NextResponse.json({ ok: false, error: "Deleted websites cannot change status" }, { status: 409 });
    }

    const now = new Date().toISOString();
    const updated = body.status === "archive"
      ? archiveWebsite(ownership.website, now)
      : activateWebsite(ownership.website, now);

    const saved = await saveOwnedWebsiteStructure(updated);

    return NextResponse.json({
      ok: true,
      website: toWebsiteManagementRecord(saved),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Status operation failed" }, { status: 500 });
  }
}

import { type NextRequest, NextResponse } from "next/server";
import {
  softDeleteWebsite,
  toWebsiteManagementRecord,
  validateWebsiteOwnership,
  WEBSITE_DELETION_STRATEGY,
  saveOwnedWebsiteStructure,
  type WebsiteDeletePayload,
} from "@/lib/management";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: WebsiteDeletePayload;
  try {
    body = (await request.json()) as WebsiteDeletePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim()) {
    return NextResponse.json({ ok: false, error: "structureId is required" }, { status: 400 });
  }

  if (body.hardDelete && !WEBSITE_DELETION_STRATEGY.hardDeleteEnabled) {
    return NextResponse.json({ ok: false, error: "Hard delete is not enabled for MVP" }, { status: 400 });
  }

  try {
    const ownership = await validateWebsiteOwnership(body.structureId, user.id);
    if (!ownership.owned || !ownership.website) {
      return NextResponse.json({ ok: false, error: "Website not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const deletedWebsite = softDeleteWebsite(ownership.website, user.id, now);
    const saved = await saveOwnedWebsiteStructure(deletedWebsite);

    return NextResponse.json({
      ok: true,
      website: toWebsiteManagementRecord(saved),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Delete operation failed" }, { status: 500 });
  }
}

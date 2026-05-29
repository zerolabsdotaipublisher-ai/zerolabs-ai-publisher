import { type NextRequest, NextResponse } from "next/server";
import {
  canRenameWebsite,
  updateWebsiteMetadata,
  toWebsiteManagementRecord,
  validateWebsiteOwnership,
  saveOwnedWebsiteStructure,
  type WebsiteRenamePayload,
} from "@/lib/management";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: WebsiteRenamePayload;
  try {
    body = (await request.json()) as WebsiteRenamePayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim() || !body.title?.trim()) {
    return NextResponse.json({ ok: false, error: "structureId and title are required" }, { status: 400 });
  }

  try {
    const ownership = await validateWebsiteOwnership(body.structureId, user.id);
    if (!ownership.owned || !ownership.website) {
      return NextResponse.json({ ok: false, error: "Website not found" }, { status: 404 });
    }

    if (!canRenameWebsite(ownership.website, user.id)) {
      return NextResponse.json({ ok: false, error: "You do not have permission to rename this website" }, { status: 403 });
    }

    const now = new Date().toISOString();
    const updatedWebsite = updateWebsiteMetadata(ownership.website, {
      title: body.title,
      description: body.description,
      now,
    });
    const saved = await saveOwnedWebsiteStructure(updatedWebsite);

    return NextResponse.json({
      ok: true,
      website: toWebsiteManagementRecord(saved),
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Rename operation failed" }, { status: 500 });
  }
}

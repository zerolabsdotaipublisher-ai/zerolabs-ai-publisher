import { NextResponse } from "next/server";
import { deleteOwnedAiAsset } from "@/lib/ai-assets";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ assetId: string }>;
}

export async function DELETE(_request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { assetId } = await context.params;
  const normalizedAssetId = decodeURIComponent(assetId).trim();

  try {
    const result = await deleteOwnedAiAsset({ userId: user.id, assetId: normalizedAssetId });
    if (!result.deleted) {
      return NextResponse.json({ ok: false, error: "AI asset not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, deleted: true });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to delete AI asset" },
      { status: 500 },
    );
  }
}

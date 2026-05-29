import { NextResponse } from "next/server";
import { canManageOwnedAiAssets, replaceOwnedAiAsset } from "@/lib/ai-assets";
import { toStorageErrorResponse } from "@/lib/storage-access/errors";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ assetId: string }>;
}

export async function POST(request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const permission = canManageOwnedAiAssets(user);
  if (!permission.allowed) {
    return NextResponse.json({ ok: false, error: permission.reason || "Forbidden" }, { status: 403 });
  }

  const { assetId } = await context.params;
  const normalizedAssetId = decodeURIComponent(assetId).trim();

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid multipart form data" }, { status: 400 });
  }

  const file = formData.get("file");
  const mediaId = typeof formData.get("mediaId") === "string" ? String(formData.get("mediaId")).trim() || undefined : undefined;
  if (!(file instanceof File) && !mediaId) {
    return NextResponse.json({ ok: false, error: "file or mediaId is required" }, { status: 400 });
  }

  try {
    const bytes = file instanceof File ? new Uint8Array(await file.arrayBuffer()) : undefined;
    const replaced = await replaceOwnedAiAsset({
      assetId: normalizedAssetId,
      userId: user.id,
      tenantId: typeof formData.get("tenantId") === "string" ? String(formData.get("tenantId")).trim() || undefined : undefined,
      mediaId,
      bytes,
      fileName: file instanceof File ? file.name : undefined,
      mimeType: file instanceof File ? file.type || "image/png" : undefined,
      fileSizeBytes: file instanceof File ? file.size : undefined,
      width: typeof formData.get("width") === "string" ? Number.parseInt(String(formData.get("width")), 10) : undefined,
      height: typeof formData.get("height") === "string" ? Number.parseInt(String(formData.get("height")), 10) : undefined,
      sourceWorkflow: typeof formData.get("sourceWorkflow") === "string" ? String(formData.get("sourceWorkflow")).trim() || undefined : undefined,
      promptText: typeof formData.get("promptText") === "string" ? String(formData.get("promptText")).trim() || undefined : undefined,
      linkedContentId: typeof formData.get("linkedContentId") === "string" ? String(formData.get("linkedContentId")).trim() || undefined : undefined,
      linkedContentType: typeof formData.get("linkedContentType") === "string" ? String(formData.get("linkedContentType")).trim() || undefined : undefined,
    });

    return NextResponse.json({ ok: true, asset: replaced.asset, signed: replaced.signed });
  } catch (error) {
    return toStorageErrorResponse(error, "Unable to replace AI asset.");
  }
}

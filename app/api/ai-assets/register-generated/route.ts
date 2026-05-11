import { NextResponse } from "next/server";
import { canManageOwnedAiAssets, registerGeneratedAiAsset } from "@/lib/ai-assets";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(request: Request): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const permission = canManageOwnedAiAssets(user);
  if (!permission.allowed) {
    return NextResponse.json({ ok: false, error: permission.reason || "Forbidden" }, { status: 403 });
  }

  const contentType = request.headers.get("content-type") || "";

  try {
    if (contentType.includes("application/json")) {
      const body = await request.json() as Record<string, unknown>;
      const registered = await registerGeneratedAiAsset({
        userId: user.id,
        tenantId: typeof body.tenantId === "string" ? body.tenantId.trim() : undefined,
        mediaId: typeof body.mediaId === "string" ? body.mediaId.trim() : undefined,
        assetType: typeof body.assetType === "string" ? body.assetType.trim().toLowerCase() as never : undefined,
        assetPurpose: typeof body.assetPurpose === "string" ? body.assetPurpose.trim().toLowerCase() as never : undefined,
        sourceWorkflow: typeof body.sourceWorkflow === "string" ? body.sourceWorkflow.trim() : undefined,
        generationProvider: typeof body.generationProvider === "string" ? body.generationProvider.trim() : undefined,
        generationModel: typeof body.generationModel === "string" ? body.generationModel.trim() : undefined,
        promptText: typeof body.promptText === "string" ? body.promptText : undefined,
        linkedContentId: typeof body.linkedContentId === "string" ? body.linkedContentId.trim() : undefined,
        linkedContentType: typeof body.linkedContentType === "string" ? body.linkedContentType.trim() : undefined,
        generationSettings: body.generationSettings && typeof body.generationSettings === "object"
          ? body.generationSettings as Record<string, unknown>
          : undefined,
        generationTarget: body.generationTarget && typeof body.generationTarget === "object"
          ? body.generationTarget as Record<string, unknown>
          : undefined,
      });

      return NextResponse.json({ ok: true, asset: registered.asset, signed: registered.signed });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "file is required" }, { status: 400 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const registered = await registerGeneratedAiAsset({
      userId: user.id,
      tenantId: typeof formData.get("tenantId") === "string" ? String(formData.get("tenantId")).trim() || undefined : undefined,
      bytes,
      fileName: file.name,
      mimeType: file.type || "image/png",
      fileSizeBytes: file.size,
      width: typeof formData.get("width") === "string" ? Number.parseInt(String(formData.get("width")), 10) : undefined,
      height: typeof formData.get("height") === "string" ? Number.parseInt(String(formData.get("height")), 10) : undefined,
      assetType: typeof formData.get("assetType") === "string" ? String(formData.get("assetType")).trim().toLowerCase() as never : undefined,
      assetPurpose: typeof formData.get("assetPurpose") === "string" ? String(formData.get("assetPurpose")).trim().toLowerCase() as never : undefined,
      sourceWorkflow: typeof formData.get("sourceWorkflow") === "string" ? String(formData.get("sourceWorkflow")).trim() || undefined : undefined,
      generationProvider: typeof formData.get("generationProvider") === "string" ? String(formData.get("generationProvider")).trim() || undefined : undefined,
      generationModel: typeof formData.get("generationModel") === "string" ? String(formData.get("generationModel")).trim() || undefined : undefined,
      promptText: typeof formData.get("promptText") === "string" ? String(formData.get("promptText")) : undefined,
      linkedContentId: typeof formData.get("linkedContentId") === "string" ? String(formData.get("linkedContentId")).trim() || undefined : undefined,
      linkedContentType: typeof formData.get("linkedContentType") === "string" ? String(formData.get("linkedContentType")).trim() || undefined : undefined,
    });

    return NextResponse.json({ ok: true, asset: registered.asset, signed: registered.signed });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to register generated asset" },
      { status: 422 },
    );
  }
}

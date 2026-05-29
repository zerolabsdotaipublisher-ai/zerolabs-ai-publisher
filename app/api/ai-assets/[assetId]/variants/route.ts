import { NextResponse } from "next/server";
import { canManageOwnedAiAssets, createOwnedAiVariant, listOwnedAiVariants } from "@/lib/ai-assets";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ assetId: string }>;
}

export async function GET(_request: Request, context: RouteContext): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { assetId } = await context.params;
  const normalizedAssetId = decodeURIComponent(assetId).trim();

  try {
    const variants = await listOwnedAiVariants({ userId: user.id, assetId: normalizedAssetId });
    return NextResponse.json({ ok: true, items: variants });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to list variants" },
      { status: 404 },
    );
  }
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
    const variant = await createOwnedAiVariant({
      assetId: normalizedAssetId,
      userId: user.id,
      tenantId: typeof formData.get("tenantId") === "string" ? String(formData.get("tenantId")).trim() || undefined : undefined,
      mediaId,
      bytes,
      fileName: file instanceof File ? file.name : undefined,
      mimeType: file instanceof File ? file.type || "image/png" : undefined,
      fileSizeBytes: file instanceof File ? file.size : undefined,
      assetType: typeof formData.get("assetType") === "string" ? String(formData.get("assetType")).trim().toLowerCase() as never : undefined,
      assetPurpose: typeof formData.get("assetPurpose") === "string" ? String(formData.get("assetPurpose")).trim().toLowerCase() as never : undefined,
      sourceWorkflow: typeof formData.get("sourceWorkflow") === "string" ? String(formData.get("sourceWorkflow")).trim() || undefined : undefined,
      promptText: typeof formData.get("promptText") === "string" ? String(formData.get("promptText")).trim() || undefined : undefined,
    });

    return NextResponse.json({ ok: true, asset: variant.asset, signed: variant.signed });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unable to create variant" },
      { status: 422 },
    );
  }
}

import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure/storage";
import { logger } from "@/lib/observability";
import { generateWebsiteSeo, storeWebsiteSeoMetadata, type SeoGenerationOptions } from "@/lib/ai/seo";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";

interface RegenerateSeoBody {
  structureId: string;
  updatedInput?: Partial<WebsiteGenerationInput>;
  options?: SeoGenerationOptions;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RegenerateSeoBody;

  try {
    body = (await request.json()) as RegenerateSeoBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim()) {
    return NextResponse.json({ error: "structureId is required" }, { status: 400 });
  }

  const existing = await getWebsiteStructure(body.structureId, user.id);

  if (!existing) {
    return NextResponse.json({ error: "Structure not found" }, { status: 404 });
  }

  const mergedInput = {
    ...existing.sourceInput,
    ...body.updatedInput,
  } as WebsiteGenerationInput;

  try {
    const nextVersion = existing.version + 1;
    const result = await generateWebsiteSeo(mergedInput, existing, user.id, {
      ...body.options,
      version: nextVersion,
    });

    const updatedStructure = await updateWebsiteStructure({
      ...result.mappedStructure,
      version: nextVersion,
      sourceInput: mergedInput,
      updatedAt: new Date().toISOString(),
    });

    await storeWebsiteSeoMetadata({
      ...result.seo,
      structureId: updatedStructure.id,
      version: updatedStructure.version,
      generatedFromInput: mergedInput,
      updatedAt: updatedStructure.updatedAt,
    });

    return NextResponse.json({
      seo: result.seo,
      structure: updatedStructure,
      usedFallback: result.usedFallback,
      validationErrors: result.validationErrors,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    logger.error("regenerate-seo route failed", {
      category: "error",
      service: "openai",
      structureId: body.structureId,
      error: { message, name: "RegenerateSeoRouteError" },
    });

    return NextResponse.json({ error: "SEO regeneration failed", message }, { status: 500 });
  }
}

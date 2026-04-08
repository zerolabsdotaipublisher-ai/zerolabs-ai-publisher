import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure/storage";
import { logger } from "@/lib/observability";
import { generateWebsiteSeo, storeWebsiteSeoMetadata, type SeoGenerationOptions } from "@/lib/ai/seo";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";

interface GenerateSeoBody {
  structureId: string;
  updatedInput?: Partial<WebsiteGenerationInput>;
  options?: SeoGenerationOptions;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: GenerateSeoBody;

  try {
    body = (await request.json()) as GenerateSeoBody;
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

  const input = {
    ...existing.sourceInput,
    ...body.updatedInput,
  } as WebsiteGenerationInput;

  try {
    const result = await generateWebsiteSeo(input, existing, user.id, {
      ...body.options,
      version: existing.version,
    });

    const updatedStructure = await updateWebsiteStructure(result.mappedStructure);
    await storeWebsiteSeoMetadata({
      ...result.seo,
      structureId: updatedStructure.id,
      version: updatedStructure.version,
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

    logger.error("generate-seo route failed", {
      category: "error",
      service: "openai",
      structureId: body.structureId,
      error: { message, name: "GenerateSeoRouteError" },
    });

    return NextResponse.json({ error: "SEO generation failed", message }, { status: 500 });
  }
}

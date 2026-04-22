import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure/storage";
import { storeWebsiteNavigation } from "@/lib/ai/navigation";
import { logger } from "@/lib/observability";
import {
  generateWebsiteContent,
  storeWebsiteGeneratedContent,
  type ContentGenerationOptions,
} from "@/lib/ai/content";
import { generateWebsiteSeo, storeWebsiteSeoMetadata } from "@/lib/ai/seo";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";
import { sanitizeInput, validateWebsiteGenerationInput } from "@/lib/ai/prompts/schemas";

interface GenerateMarketingBody {
  structureId: string;
  updatedInput?: Partial<WebsiteGenerationInput>;
  options?: ContentGenerationOptions;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: GenerateMarketingBody;

  try {
    body = (await request.json()) as GenerateMarketingBody;
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

  const input = sanitizeInput({
    ...existing.sourceInput,
    ...body.updatedInput,
  });

  const inputErrors = validateWebsiteGenerationInput(input);
  if (inputErrors.length > 0) {
    return NextResponse.json(
      { error: "Invalid input", details: inputErrors },
      { status: 422 },
    );
  }

  try {
    const options = body.options;
    const result = await generateWebsiteContent(input, existing, user.id, options);
    const seoResult = await generateWebsiteSeo(input, result.mappedStructure, user.id, {
      version: result.mappedStructure.version,
      pages: options?.pages,
    });
    await storeWebsiteGeneratedContent(result.content);
    const updatedStructure = await updateWebsiteStructure(seoResult.mappedStructure);
    await storeWebsiteNavigation({
      structureId: updatedStructure.id,
      userId: user.id,
      navigation: updatedStructure.navigation,
      version: updatedStructure.version,
      createdAt: updatedStructure.generatedAt,
      updatedAt: updatedStructure.updatedAt,
    });
    await storeWebsiteSeoMetadata({
      ...seoResult.seo,
      structureId: updatedStructure.id,
      version: updatedStructure.version,
      updatedAt: updatedStructure.updatedAt,
    });

    return NextResponse.json({
      content: result.content,
      structure: updatedStructure,
      seo: seoResult.seo,
      usedFallback: result.usedFallback || seoResult.usedFallback,
      validationErrors: [...result.validationErrors, ...seoResult.validationErrors],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    logger.error("marketing generate route failed", {
      category: "error",
      service: "openai",
      structureId: body.structureId,
      error: { message, name: "GenerateMarketingRouteError" },
    });

    return NextResponse.json(
      { error: "Marketing generation failed", message },
      { status: 500 },
    );
  }
}

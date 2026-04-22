import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure/storage";
import { storeWebsiteNavigation } from "@/lib/ai/navigation";
import { logger } from "@/lib/observability";
import {
  regenerateWebsiteContent,
  storeWebsiteGeneratedContent,
  type ContentGenerationOptions,
  type ContentSectionType,
} from "@/lib/ai/content";
import { generateWebsiteSeo, storeWebsiteSeoMetadata } from "@/lib/ai/seo";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";

interface RegenerateMarketingBody {
  structureId: string;
  updatedInput?: Partial<WebsiteGenerationInput>;
  options?: ContentGenerationOptions;
}

function isContentSectionType(value: string): value is ContentSectionType {
  return value !== "custom";
}

function resolveTargetedOptions(
  structure: Awaited<ReturnType<typeof getWebsiteStructure>>,
  options?: ContentGenerationOptions,
): ContentGenerationOptions | undefined {
  if (!structure || !options?.targetSectionIds?.length) {
    return options;
  }

  const matches = structure.pages.flatMap((page) =>
    page.sections
      .filter((section) => options.targetSectionIds?.includes(section.id))
      .map((section) => ({
        pageSlug: page.slug,
        sectionType: section.type,
      })),
  );

  if (!matches.length) {
    return options;
  }

  const targetedSectionTypes = matches
    .map((match) => match.sectionType)
    .filter((sectionType) => isContentSectionType(sectionType)) as ContentSectionType[];

  return {
    ...options,
    pages: Array.from(new Set([...(options.pages ?? []), ...matches.map((match) => match.pageSlug)])),
    sectionTypes: Array.from(new Set([...(options.sectionTypes ?? []), ...targetedSectionTypes])),
  };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RegenerateMarketingBody;

  try {
    body = (await request.json()) as RegenerateMarketingBody;
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

  try {
    const options = resolveTargetedOptions(existing, body.options);
    const result = await regenerateWebsiteContent(
      existing,
      user.id,
      body.updatedInput,
      options as ContentGenerationOptions,
    );

    const seoResult = await generateWebsiteSeo(
      result.mappedStructure.sourceInput,
      result.mappedStructure,
      user.id,
      {
        version: result.mappedStructure.version,
        pages: options?.pages,
      },
    );

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

    logger.error("marketing regenerate route failed", {
      category: "error",
      service: "openai",
      structureId: body.structureId,
      error: { message, name: "RegenerateMarketingRouteError" },
    });

    return NextResponse.json(
      { error: "Marketing regeneration failed", message },
      { status: 500 },
    );
  }
}

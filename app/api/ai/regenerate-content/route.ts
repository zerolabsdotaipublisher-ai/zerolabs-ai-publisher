import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure/storage";
import { storeWebsiteNavigation } from "@/lib/ai/navigation";
import { logger } from "@/lib/observability";
import { listOwnedContentLibraryPage } from "@/lib/content/library";
import {
  regenerateWebsiteContent,
  storeWebsiteGeneratedContent,
  type ContentGenerationOptions,
} from "@/lib/ai/content";
import { generateWebsiteSeo, storeWebsiteSeoMetadata } from "@/lib/ai/seo";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";
import { toRevisionWorkflowIdMap } from "@/lib/revisions/model";
import { recordContentRevisionAction } from "@/lib/revisions/workflow";

interface RegenerateContentBody {
  structureId: string;
  updatedInput?: Partial<WebsiteGenerationInput>;
  options?: ContentGenerationOptions;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RegenerateContentBody;

  try {
    body = (await request.json()) as RegenerateContentBody;
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
    const result = await regenerateWebsiteContent(
      existing,
      user.id,
      body.updatedInput,
      body.options as ContentGenerationOptions,
    );

    const seoResult = await generateWebsiteSeo(
      result.mappedStructure.sourceInput,
      result.mappedStructure,
      user.id,
      {
        version: result.mappedStructure.version,
        pages: body.options?.pages,
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
    const library = await listOwnedContentLibraryPage(user.id, {
      page: 1,
      perPage: 5000,
      search: undefined,
      type: "website_page",
      status: "all",
      websiteId: body.structureId,
      sort: "updated_desc",
    });
    const targetPages = new Set(body.options?.pages ?? []);
    const targetItems = library.items.filter((item) =>
      !item.linkedWebsite?.structureId
        ? false
        : targetPages.size === 0
          ? true
          : (item.pageSlug ? targetPages.has(item.pageSlug) : false),
    );
    await Promise.all(
      targetItems.map((item) =>
        recordContentRevisionAction({
          userId: user.id,
          contentId: item.id,
          actionType: "ai_regenerate",
          relatedWorkflowIds: toRevisionWorkflowIdMap(),
          metadata: {
            structureId: body.structureId,
            pageSlug: item.pageSlug,
          },
        }),
      ),
    );

    return NextResponse.json({
      content: result.content,
      structure: updatedStructure,
      seo: seoResult.seo,
      usedFallback: result.usedFallback || seoResult.usedFallback,
      validationErrors: [...result.validationErrors, ...seoResult.validationErrors],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    logger.error("regenerate-content route failed", {
      category: "error",
      service: "openai",
      structureId: body.structureId,
      error: { message, name: "RegenerateContentRouteError" },
    });

    return NextResponse.json(
      { error: "Content regeneration failed", message },
      { status: 500 },
    );
  }
}

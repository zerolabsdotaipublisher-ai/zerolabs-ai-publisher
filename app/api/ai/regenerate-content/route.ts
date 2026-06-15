import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure/storage";
import { storeWebsiteNavigation } from "@/lib/ai/navigation";
import { createRequestId } from "@/lib/observability";
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
import {
  createGenerationRouteErrorResponse,
  createLoggedGenerationFailureResponse,
} from "@/lib/ai/route-diagnostics";

interface RegenerateContentBody {
  structureId: string;
  updatedInput?: Partial<WebsiteGenerationInput>;
  options?: ContentGenerationOptions;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = createRequestId(request);
  const user = await getServerUser();

  if (!user) {
    return createLoggedGenerationFailureResponse({
      route: "regenerate-content",
      requestId,
      status: 401,
      diagnosticCode: "UNAUTHORIZED",
      stage: "auth",
      source: "route_guard",
      body: { error: "Unauthorized" },
    });
  }

  let body: RegenerateContentBody;

  try {
    body = (await request.json()) as RegenerateContentBody;
  } catch {
    return createLoggedGenerationFailureResponse({
      route: "regenerate-content",
      requestId,
      status: 400,
      diagnosticCode: "INVALID_JSON",
      stage: "input",
      source: "route_guard",
      userId: user.id,
      body: { error: "Invalid JSON body" },
    });
  }

  if (!body.structureId?.trim()) {
    return createLoggedGenerationFailureResponse({
      route: "regenerate-content",
      requestId,
      status: 400,
      diagnosticCode: "STRUCTURE_ID_REQUIRED",
      stage: "input",
      source: "route_guard",
      userId: user.id,
      body: { error: "structureId is required" },
    });
  }

  const existing = await getWebsiteStructure(body.structureId, user.id);

  if (!existing) {
    return createLoggedGenerationFailureResponse({
      route: "regenerate-content",
      requestId,
      status: 404,
      diagnosticCode: "STRUCTURE_NOT_FOUND",
      stage: "lookup",
      source: "route_guard",
      structureId: body.structureId,
      userId: user.id,
      body: { error: "Structure not found" },
    });
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

    return NextResponse.json(
      {
        content: result.content,
        structure: updatedStructure,
        seo: seoResult.seo,
        usedFallback: result.usedFallback || seoResult.usedFallback,
        validationErrors: [...result.validationErrors, ...seoResult.validationErrors],
      },
      {
        headers: {
          "x-request-id": requestId,
        },
      },
    );
  } catch (err) {
    return createGenerationRouteErrorResponse({
      err,
      route: "regenerate-content",
      requestId,
      structureId: body.structureId,
      userId: user.id,
      websiteType: existing.sourceInput.websiteType,
    });
  }
}

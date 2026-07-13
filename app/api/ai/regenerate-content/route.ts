import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure/storage";
import { createRequestId, logger } from "@/lib/observability";
import { listOwnedContentLibraryPage } from "@/lib/content/library";
import {
  regenerateWebsiteContent,
  type ContentGenerationOptions,
} from "@/lib/ai/content";
import { generateWebsiteSeo } from "@/lib/ai/seo";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";
import { toRevisionWorkflowIdMap } from "@/lib/revisions/model";
import { recordContentRevisionAction } from "@/lib/revisions/workflow";
import {
  createGenerationVersionSnapshot,
  persistNonCriticalGenerationArtifacts,
} from "@/lib/generation/persistence";
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
      failedStage: "auth",
      safeErrorCategory: "session-expired",
      source: "route_guard",
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
      failedStage: "payload-validation",
      safeErrorCategory: "payload-invalid",
      source: "route_guard",
      userId: user.id,
    });
  }

  if (!body.structureId?.trim()) {
    return createLoggedGenerationFailureResponse({
      route: "regenerate-content",
      requestId,
      status: 400,
      diagnosticCode: "STRUCTURE_ID_REQUIRED",
      failedStage: "retry-state",
      safeErrorCategory: "retry-state-invalid",
      source: "route_guard",
      userId: user.id,
    });
  }

  const existing = await getWebsiteStructure(body.structureId, user.id);

  if (!existing) {
    return createLoggedGenerationFailureResponse({
      route: "regenerate-content",
      requestId,
      status: 404,
      diagnosticCode: "STRUCTURE_NOT_FOUND",
      failedStage: "retry-state",
      safeErrorCategory: "retry-state-invalid",
      source: "route_guard",
      structureId: body.structureId,
      userId: user.id,
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

    const updatedStructure = await updateWebsiteStructure(seoResult.mappedStructure);
    const versionId = await createGenerationVersionSnapshot({
      structure: updatedStructure,
      userId: user.id,
      requestId,
    });
    await persistNonCriticalGenerationArtifacts({
      structure: updatedStructure,
      userId: user.id,
      requestId,
      content: result.content,
      seo: {
        ...seoResult.seo,
        structureId: updatedStructure.id,
        version: updatedStructure.version,
        updatedAt: updatedStructure.updatedAt,
      },
    });
    try {
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
    } catch (error) {
      logger.warn("regenerated content follow-up audit skipped", {
        category: "error",
        service: "supabase",
        requestId,
        structureId: body.structureId,
        failedStage: "database-save",
        safeErrorCategory: "database-save-failed",
        error: {
          name: "RegenerateContentFollowUpWarning",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }

    return NextResponse.json(
      {
        content: result.content,
        structure: updatedStructure,
        versionId,
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

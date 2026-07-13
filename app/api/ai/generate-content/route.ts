import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure/storage";
import { createRequestId } from "@/lib/observability";
import {
  generateWebsiteContent,
  type ContentGenerationOptions,
} from "@/lib/ai/content";
import { generateWebsiteSeo } from "@/lib/ai/seo";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";
import { sanitizeInput, validateWebsiteGenerationInput } from "@/lib/ai/prompts/schemas";
import {
  createGenerationVersionSnapshot,
  persistNonCriticalGenerationArtifacts,
} from "@/lib/generation/persistence";
import {
  createGenerationRouteErrorResponse,
  createLoggedGenerationFailureResponse,
} from "@/lib/ai/route-diagnostics";

interface GenerateContentBody {
  structureId: string;
  updatedInput?: Partial<WebsiteGenerationInput>;
  options?: ContentGenerationOptions;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = createRequestId(request);
  const user = await getServerUser();

  if (!user) {
    return createLoggedGenerationFailureResponse({
      route: "generate-content",
      requestId,
      status: 401,
      diagnosticCode: "UNAUTHORIZED",
      failedStage: "auth",
      safeErrorCategory: "session-expired",
      source: "route_guard",
    });
  }

  let body: GenerateContentBody;

  try {
    body = (await request.json()) as GenerateContentBody;
  } catch {
    return createLoggedGenerationFailureResponse({
      route: "generate-content",
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
      route: "generate-content",
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
      route: "generate-content",
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

  const input = sanitizeInput({
    ...existing.sourceInput,
    ...body.updatedInput,
  });

  const inputErrors = validateWebsiteGenerationInput(input);
  if (inputErrors.length > 0) {
    return createLoggedGenerationFailureResponse({
      route: "generate-content",
      requestId,
      status: 422,
      diagnosticCode: "INVALID_INPUT",
      failedStage: "payload-validation",
      safeErrorCategory: "payload-invalid",
      source: "route_guard",
      structureId: body.structureId,
      userId: user.id,
      websiteType: input.websiteType,
      details: inputErrors,
    });
  }

  try {
    const result = await generateWebsiteContent(input, existing, user.id, body.options);
    const seoResult = await generateWebsiteSeo(input, result.mappedStructure, user.id, {
      version: result.mappedStructure.version,
      pages: body.options?.pages,
    });
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
      route: "generate-content",
      requestId,
      structureId: body.structureId,
      userId: user.id,
      websiteType: input.websiteType,
    });
  }
}

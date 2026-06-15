import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure/storage";
import { storeWebsiteNavigation } from "@/lib/ai/navigation";
import { createRequestId } from "@/lib/observability";
import {
  generateWebsiteContent,
  storeWebsiteGeneratedContent,
  type ContentGenerationOptions,
} from "@/lib/ai/content";
import { generateWebsiteSeo, storeWebsiteSeoMetadata } from "@/lib/ai/seo";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";
import { sanitizeInput, validateWebsiteGenerationInput } from "@/lib/ai/prompts/schemas";
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
      stage: "auth",
      source: "route_guard",
      body: { error: "Unauthorized" },
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
      stage: "input",
      source: "route_guard",
      userId: user.id,
      body: { error: "Invalid JSON body" },
    });
  }

  if (!body.structureId?.trim()) {
    return createLoggedGenerationFailureResponse({
      route: "generate-content",
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
      route: "generate-content",
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
      stage: "input",
      source: "route_guard",
      structureId: body.structureId,
      userId: user.id,
      websiteType: input.websiteType,
      details: inputErrors,
      body: { error: "Invalid input", details: inputErrors },
    });
  }

  try {
    const result = await generateWebsiteContent(input, existing, user.id, body.options);
    const seoResult = await generateWebsiteSeo(input, result.mappedStructure, user.id, {
      version: result.mappedStructure.version,
      pages: body.options?.pages,
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
      route: "generate-content",
      requestId,
      structureId: body.structureId,
      userId: user.id,
      websiteType: input.websiteType,
    });
  }
}

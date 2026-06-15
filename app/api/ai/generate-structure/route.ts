/**
 * POST /api/ai/generate-structure
 *
 * Accept a WebsiteGenerationInput, generate a WebsiteStructure using the AI
 * generation service, persist it, and return the result.
 *
 * Authentication: requires an active session (returns 401 otherwise).
 * Validation:     returns 422 when the input fails schema validation.
 *
 * Response shape (200):
 * {
 *   "structure":       WebsiteStructure,
 *   "usedFallback":    boolean,
 *   "validationErrors": string[]
 * }
 */

import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { generateWebsiteStructure } from "@/lib/ai/structure/generator";
import { storeWebsiteStructure } from "@/lib/ai/structure/storage";
import { storeWebsiteNavigation } from "@/lib/ai/navigation";
import { generateWebsiteSeo, storeWebsiteSeoMetadata } from "@/lib/ai/seo";
import {
  validateWebsiteGenerationInput,
  sanitizeInput,
} from "@/lib/ai/prompts/schemas";
import { createRequestId } from "@/lib/observability";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";
import {
  createGenerationRouteErrorResponse,
  createLoggedGenerationFailureResponse,
} from "@/lib/ai/route-diagnostics";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = createRequestId(request);
  const user = await getServerUser();

  if (!user) {
    return createLoggedGenerationFailureResponse({
      route: "generate-structure",
      requestId,
      status: 401,
      diagnosticCode: "UNAUTHORIZED",
      stage: "auth",
      source: "route_guard",
      body: { error: "Unauthorized" },
    });
  }

  let body: WebsiteGenerationInput;

  try {
    body = (await request.json()) as WebsiteGenerationInput;
  } catch {
    return createLoggedGenerationFailureResponse({
      route: "generate-structure",
      requestId,
      status: 400,
      diagnosticCode: "INVALID_JSON",
      stage: "input",
      source: "route_guard",
      userId: user.id,
      body: { error: "Invalid JSON body" },
    });
  }

  const input = sanitizeInput(body);
  const validationErrors = validateWebsiteGenerationInput(input);

  if (validationErrors.length > 0) {
    return createLoggedGenerationFailureResponse({
      route: "generate-structure",
      requestId,
      status: 422,
      diagnosticCode: "INVALID_INPUT",
      stage: "input",
      source: "route_guard",
      userId: user.id,
      websiteType: input.websiteType,
      details: validationErrors,
      body: { error: "Invalid input", details: validationErrors },
    });
  }

  try {
    const result = await generateWebsiteStructure(input, user.id);
    const seoResult = await generateWebsiteSeo(input, result.structure, user.id, {
      version: result.structure.version,
    });
    const stored = await storeWebsiteStructure(seoResult.mappedStructure);
    await storeWebsiteNavigation({
      structureId: stored.id,
      userId: user.id,
      navigation: stored.navigation,
      version: stored.version,
      createdAt: stored.generatedAt,
      updatedAt: stored.updatedAt,
    });
    await storeWebsiteSeoMetadata({
      ...seoResult.seo,
      structureId: stored.id,
      version: stored.version,
      updatedAt: stored.updatedAt,
    });

    return NextResponse.json(
      {
        structure: stored,
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
      route: "generate-structure",
      requestId,
      userId: user.id,
      websiteType: input.websiteType,
    });
  }
}

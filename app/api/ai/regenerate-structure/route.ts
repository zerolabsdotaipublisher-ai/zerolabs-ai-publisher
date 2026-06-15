/**
 * POST /api/ai/regenerate-structure
 *
 * Re-run generation for an existing website structure.  Accepts the
 * structure ID and an optional partial input override, then stores the
 * updated structure and returns it.
 *
 * Authentication: requires an active session (returns 401 otherwise).
 * Ownership:      the structure must belong to the authenticated user
 *                 (returns 404 otherwise).
 *
 * Request body shape:
 * {
 *   "structureId":   string,                   // required
 *   "updatedInput":  Partial<WebsiteGenerationInput>  // optional overrides
 * }
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
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure/storage";
import { regenerateWebsiteStructure } from "@/lib/ai/structure/regeneration";
import { storeWebsiteNavigation } from "@/lib/ai/navigation";
import { generateWebsiteSeo, storeWebsiteSeoMetadata } from "@/lib/ai/seo";
import { createRequestId } from "@/lib/observability";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";
import {
  createGenerationRouteErrorResponse,
  createLoggedGenerationFailureResponse,
} from "@/lib/ai/route-diagnostics";

interface RegenerateBody {
  structureId: string;
  updatedInput?: Partial<WebsiteGenerationInput>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const requestId = createRequestId(request);
  const user = await getServerUser();

  if (!user) {
    return createLoggedGenerationFailureResponse({
      route: "regenerate-structure",
      requestId,
      status: 401,
      diagnosticCode: "UNAUTHORIZED",
      stage: "auth",
      source: "route_guard",
      body: { error: "Unauthorized" },
    });
  }

  let body: RegenerateBody;

  try {
    body = (await request.json()) as RegenerateBody;
  } catch {
    return createLoggedGenerationFailureResponse({
      route: "regenerate-structure",
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
      route: "regenerate-structure",
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
      route: "regenerate-structure",
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
    const result = await regenerateWebsiteStructure(
      existing,
      user.id,
      body.updatedInput,
    );
    const seoResult = await generateWebsiteSeo(
      result.structure.sourceInput,
      result.structure,
      user.id,
      { version: result.structure.version },
    );
    const updated = await updateWebsiteStructure(seoResult.mappedStructure);
    await storeWebsiteNavigation({
      structureId: updated.id,
      userId: user.id,
      navigation: updated.navigation,
      version: updated.version,
      createdAt: updated.generatedAt,
      updatedAt: updated.updatedAt,
    });
    await storeWebsiteSeoMetadata({
      ...seoResult.seo,
      structureId: updated.id,
      version: updated.version,
      updatedAt: updated.updatedAt,
    });

    return NextResponse.json(
      {
        structure: updated,
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
      route: "regenerate-structure",
      requestId,
      structureId: body.structureId,
      userId: user.id,
      websiteType: existing.sourceInput.websiteType,
    });
  }
}

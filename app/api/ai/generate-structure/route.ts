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
import { logger } from "@/lib/observability";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: WebsiteGenerationInput;

  try {
    body = (await request.json()) as WebsiteGenerationInput;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = sanitizeInput(body);
  const validationErrors = validateWebsiteGenerationInput(input);

  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: "Invalid input", details: validationErrors },
      { status: 422 },
    );
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

    return NextResponse.json({
      structure: stored,
      seo: seoResult.seo,
      usedFallback: result.usedFallback || seoResult.usedFallback,
      validationErrors: [...result.validationErrors, ...seoResult.validationErrors],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    logger.error("generate-structure route failed", {
      category: "error",
      service: "openai",
      error: { message, name: "GenerateStructureError" },
    });

    return NextResponse.json(
      { error: "Generation failed", message },
      { status: 500 },
    );
  }
}

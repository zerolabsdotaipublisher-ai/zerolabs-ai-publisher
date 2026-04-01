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
    const stored = await storeWebsiteStructure(result.structure);

    return NextResponse.json({
      structure: stored,
      usedFallback: result.usedFallback,
      validationErrors: result.validationErrors,
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

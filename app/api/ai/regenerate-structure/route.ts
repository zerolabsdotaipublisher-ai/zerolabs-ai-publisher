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
import { logger } from "@/lib/observability";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";

interface RegenerateBody {
  structureId: string;
  updatedInput?: Partial<WebsiteGenerationInput>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RegenerateBody;

  try {
    body = (await request.json()) as RegenerateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim()) {
    return NextResponse.json(
      { error: "structureId is required" },
      { status: 400 },
    );
  }

  const existing = await getWebsiteStructure(body.structureId, user.id);

  if (!existing) {
    return NextResponse.json({ error: "Structure not found" }, { status: 404 });
  }

  try {
    const result = await regenerateWebsiteStructure(
      existing,
      user.id,
      body.updatedInput,
    );
    const updated = await updateWebsiteStructure(result.structure);
    await storeWebsiteNavigation({
      structureId: updated.id,
      userId: user.id,
      navigation: updated.navigation,
      version: updated.version,
      createdAt: updated.generatedAt,
      updatedAt: updated.updatedAt,
    });

    return NextResponse.json({
      structure: updated,
      usedFallback: result.usedFallback,
      validationErrors: result.validationErrors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    logger.error("regenerate-structure route failed", {
      category: "error",
      service: "openai",
      structureId: body.structureId,
      error: { message, name: "RegenerateStructureError" },
    });

    return NextResponse.json(
      { error: "Regeneration failed", message },
      { status: 500 },
    );
  }
}

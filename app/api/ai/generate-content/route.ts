import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure/storage";
import { storeWebsiteNavigation } from "@/lib/ai/navigation";
import { logger } from "@/lib/observability";
import {
  generateWebsiteContent,
  storeWebsiteGeneratedContent,
  type ContentGenerationOptions,
} from "@/lib/ai/content";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";
import { sanitizeInput, validateWebsiteGenerationInput } from "@/lib/ai/prompts/schemas";

interface GenerateContentBody {
  structureId: string;
  updatedInput?: Partial<WebsiteGenerationInput>;
  options?: ContentGenerationOptions;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: GenerateContentBody;

  try {
    body = (await request.json()) as GenerateContentBody;
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

  const input = sanitizeInput({
    ...existing.sourceInput,
    ...body.updatedInput,
  });

  const inputErrors = validateWebsiteGenerationInput(input);
  if (inputErrors.length > 0) {
    return NextResponse.json(
      { error: "Invalid input", details: inputErrors },
      { status: 422 },
    );
  }

  try {
    const result = await generateWebsiteContent(input, existing, user.id, body.options);
    await storeWebsiteGeneratedContent(result.content);
    const updatedStructure = await updateWebsiteStructure(result.mappedStructure);
    await storeWebsiteNavigation({
      structureId: updatedStructure.id,
      userId: user.id,
      navigation: updatedStructure.navigation,
      version: updatedStructure.version,
      createdAt: updatedStructure.generatedAt,
      updatedAt: updatedStructure.updatedAt,
    });

    return NextResponse.json({
      content: result.content,
      structure: updatedStructure,
      usedFallback: result.usedFallback,
      validationErrors: result.validationErrors,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    logger.error("generate-content route failed", {
      category: "error",
      service: "openai",
      structureId: body.structureId,
      error: { message, name: "GenerateContentRouteError" },
    });

    return NextResponse.json(
      { error: "Content generation failed", message },
      { status: 500 },
    );
  }
}

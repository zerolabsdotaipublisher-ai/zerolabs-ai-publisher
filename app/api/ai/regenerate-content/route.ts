import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure/storage";
import { storeWebsiteNavigation } from "@/lib/ai/navigation";
import { logger } from "@/lib/observability";
import {
  regenerateWebsiteContent,
  storeWebsiteGeneratedContent,
  type ContentGenerationOptions,
} from "@/lib/ai/content";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";

interface RegenerateContentBody {
  structureId: string;
  updatedInput?: Partial<WebsiteGenerationInput>;
  options?: ContentGenerationOptions;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RegenerateContentBody;

  try {
    body = (await request.json()) as RegenerateContentBody;
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

  try {
    const result = await regenerateWebsiteContent(
      existing,
      user.id,
      body.updatedInput,
      body.options as ContentGenerationOptions,
    );

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

    logger.error("regenerate-content route failed", {
      category: "error",
      service: "openai",
      structureId: body.structureId,
      error: { message, name: "RegenerateContentRouteError" },
    });

    return NextResponse.json(
      { error: "Content regeneration failed", message },
      { status: 500 },
    );
  }
}

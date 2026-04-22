import { type NextRequest, NextResponse } from "next/server";
import { storeWebsiteStructure } from "@/lib/ai/structure";
import { persistWebsiteStructureArtifacts } from "@/lib/editor/storage";
import {
  collectArticleQualityNotes,
  createArticleMetadata,
  generateArticle,
  normalizeArticle,
  sanitizeArticleGenerationInput,
  upsertArticle,
  validateArticleGenerationInput,
} from "@/lib/article";
import { logger } from "@/lib/observability";
import { getServerUser } from "@/lib/supabase/server";
import { createWebsiteVersionLabel } from "@/lib/versions/model";
import { createWebsiteVersion } from "@/lib/versions/storage";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = sanitizeArticleGenerationInput(body as Parameters<typeof sanitizeArticleGenerationInput>[0]);
  const errors = validateArticleGenerationInput(input);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Invalid input", details: errors }, { status: 422 });
  }

  try {
    const result = await generateArticle(input, user.id);
    const storedStructure = await storeWebsiteStructure(result.structure);
    await persistWebsiteStructureArtifacts(storedStructure, user.id);
    const versionRecord = await createWebsiteVersion({
      structure: storedStructure,
      userId: user.id,
      source: "generate",
      status: "draft",
      label: createWebsiteVersionLabel("generate", storedStructure),
    });
    const normalizedArticle = normalizeArticle({
      ...result.article,
      structureId: storedStructure.id,
      version: storedStructure.version,
      generatedAt: storedStructure.generatedAt,
      updatedAt: storedStructure.updatedAt,
    });
    const qualityNotes = collectArticleQualityNotes(normalizedArticle);

    const storedArticle = await upsertArticle(
      {
        ...normalizedArticle,
        metadata: createArticleMetadata({
          input: normalizedArticle.sourceInput,
          generatedAt: normalizedArticle.generatedAt,
          updatedAt: normalizedArticle.updatedAt,
          title: normalizedArticle.title,
          subtitle: normalizedArticle.subtitle,
          sections: normalizedArticle.sections,
          introduction: normalizedArticle.introduction,
          conclusion: normalizedArticle.conclusion,
          callToAction: normalizedArticle.callToAction,
          references: normalizedArticle.references,
          qualityNotes,
          versionId: versionRecord.id,
        }),
      },
      user.id,
    );

    return NextResponse.json({
      article: storedArticle,
      structure: storedStructure,
      versionId: versionRecord.id,
      previewPath: `/preview/${storedStructure.id}?page=/${storedArticle.slug}`,
      usedFallback: result.usedFallback,
      validationErrors: result.validationErrors,
    });
  } catch (error) {
    logger.error("article generate route failed", {
      category: "error",
      service: "openai",
      error: {
        name: "ArticleGenerateRouteError",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json({ error: "Article generation failed" }, { status: 500 });
  }
}

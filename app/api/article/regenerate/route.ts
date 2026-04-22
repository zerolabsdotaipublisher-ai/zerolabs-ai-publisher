import { type NextRequest, NextResponse } from "next/server";
import { createArticleMetadata } from "@/lib/article";
import {
  collectArticleQualityNotes,
  getArticleByStructureId,
  normalizeArticle,
  regenerateArticle,
  upsertArticle,
  type ArticleGenerationInput,
} from "@/lib/article";
import { saveEditorStructureDraft } from "@/lib/editor/storage";
import { logger } from "@/lib/observability";
import { getServerUser } from "@/lib/supabase/server";

interface RegenerateArticleBody {
  structureId?: string;
  scope?: "full" | "section";
  sectionId?: string;
  updatedInput?: Partial<ArticleGenerationInput>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RegenerateArticleBody;
  try {
    body = (await request.json()) as RegenerateArticleBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim()) {
    return NextResponse.json({ error: "structureId is required" }, { status: 400 });
  }

  const existingArticle = await getArticleByStructureId(body.structureId, user.id);
  if (!existingArticle) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  try {
    const regenerated = await regenerateArticle(existingArticle, user.id, {
      scope: body.scope,
      sectionId: body.sectionId,
      updatedInput: body.updatedInput,
    });

    const draftSave = await saveEditorStructureDraft(user.id, regenerated.structure);
    if (!draftSave.structure || draftSave.error) {
      return NextResponse.json(
        {
          error: draftSave.error || "Unable to persist regenerated article structure",
          validationErrors: draftSave.validationErrors,
        },
        { status: draftSave.validationErrors.length > 0 ? 422 : 500 },
      );
    }

    const normalizedArticle = normalizeArticle({
      ...regenerated.article,
      structureId: draftSave.structure.id,
      version: draftSave.structure.version,
      updatedAt: draftSave.structure.updatedAt,
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
          versionId: draftSave.versionId ?? normalizedArticle.metadata.versionId,
        }),
      },
      user.id,
    );

    return NextResponse.json({
      article: storedArticle,
      structure: draftSave.structure,
      versionId: draftSave.versionId,
      usedFallback: regenerated.usedFallback,
      validationErrors: regenerated.validationErrors,
    });
  } catch (error) {
    logger.error("article regenerate route failed", {
      category: "error",
      service: "openai",
      structureId: body.structureId,
      error: {
        name: "ArticleRegenerateRouteError",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json({ error: "Article regeneration failed" }, { status: 500 });
  }
}

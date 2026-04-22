import { type NextRequest, NextResponse } from "next/server";
import { createArticleMetadata } from "@/lib/article";
import {
  collectArticleQualityNotes,
  getArticleByStructureId,
  mapArticleToWebsiteStructure,
  normalizeArticle,
  upsertArticle,
  validateGeneratedArticle,
  type GeneratedArticle,
} from "@/lib/article";
import { saveEditorStructureDraft } from "@/lib/editor/storage";
import { getServerUser } from "@/lib/supabase/server";

interface SaveArticleBody {
  structureId?: string;
  article?: GeneratedArticle;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SaveArticleBody;
  try {
    body = (await request.json()) as SaveArticleBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim() || !body.article) {
    return NextResponse.json({ error: "structureId and article are required" }, { status: 400 });
  }

  const existingArticle = await getArticleByStructureId(body.structureId, user.id);
  if (!existingArticle) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const normalizedArticle = normalizeArticle({
    ...existingArticle,
    ...body.article,
    id: existingArticle.id,
    structureId: existingArticle.structureId,
    sourceInput: existingArticle.sourceInput,
    generatedAt: existingArticle.generatedAt,
    updatedAt: new Date().toISOString(),
  });
  const qualityNotes = collectArticleQualityNotes(normalizedArticle);
  const finalArticle: GeneratedArticle = {
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
      versionId: normalizedArticle.metadata.versionId,
    }),
  };
  const validationErrors = validateGeneratedArticle(finalArticle);

  if (validationErrors.length > 0) {
    return NextResponse.json({ error: "Invalid article draft", validationErrors }, { status: 422 });
  }

  const draftSave = await saveEditorStructureDraft(user.id, mapArticleToWebsiteStructure(finalArticle, user.id));
  if (!draftSave.structure || draftSave.error) {
    return NextResponse.json(
      {
        error: draftSave.error || "Unable to persist article edits",
        validationErrors: draftSave.validationErrors,
      },
      { status: draftSave.validationErrors.length > 0 ? 422 : 500 },
    );
  }

  const storedArticle = await upsertArticle(
    {
      ...finalArticle,
      version: draftSave.structure.version,
      updatedAt: draftSave.structure.updatedAt,
      metadata: {
        ...finalArticle.metadata,
        versionId: draftSave.versionId ?? finalArticle.metadata.versionId,
      },
    },
    user.id,
  );

  return NextResponse.json({
    ok: true,
    article: storedArticle,
    structure: draftSave.structure,
    versionId: draftSave.versionId,
    validationErrors: [],
  });
}

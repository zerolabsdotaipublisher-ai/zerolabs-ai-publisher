import { type NextRequest, NextResponse } from "next/server";
import { createBlogMetadata } from "@/lib/blog";
import {
  collectBlogQualityNotes,
  getBlogPostByStructureId,
  mapBlogToWebsiteStructure,
  normalizeBlogPost,
  upsertBlogPost,
  validateGeneratedBlogPost,
  type GeneratedBlogPost,
} from "@/lib/blog";
import { saveEditorStructureDraft } from "@/lib/editor/storage";
import { getServerUser } from "@/lib/supabase/server";

interface SaveBlogBody {
  structureId?: string;
  blog?: GeneratedBlogPost;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SaveBlogBody;
  try {
    body = (await request.json()) as SaveBlogBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim() || !body.blog) {
    return NextResponse.json({ error: "structureId and blog are required" }, { status: 400 });
  }

  const existingBlog = await getBlogPostByStructureId(body.structureId, user.id);
  if (!existingBlog) {
    return NextResponse.json({ error: "Blog not found" }, { status: 404 });
  }

  const normalizedBlog = normalizeBlogPost({
    ...existingBlog,
    ...body.blog,
    id: existingBlog.id,
    structureId: existingBlog.structureId,
    sourceInput: existingBlog.sourceInput,
    generatedAt: existingBlog.generatedAt,
    updatedAt: new Date().toISOString(),
  });
  const qualityNotes = collectBlogQualityNotes(normalizedBlog);
  const finalBlog: GeneratedBlogPost = {
    ...normalizedBlog,
    metadata: createBlogMetadata({
      input: normalizedBlog.sourceInput,
      generatedAt: normalizedBlog.generatedAt,
      updatedAt: normalizedBlog.updatedAt,
      sections: normalizedBlog.sections,
      introduction: normalizedBlog.introduction,
      conclusion: normalizedBlog.conclusion,
      callToAction: normalizedBlog.callToAction,
      qualityNotes,
      versionId: normalizedBlog.metadata.versionId,
    }),
  };
  const validationErrors = validateGeneratedBlogPost(finalBlog);

  if (validationErrors.length > 0) {
    return NextResponse.json({ error: "Invalid blog draft", validationErrors }, { status: 422 });
  }

  const draftSave = await saveEditorStructureDraft(user.id, mapBlogToWebsiteStructure(finalBlog, user.id));
  if (!draftSave.structure || draftSave.error) {
    return NextResponse.json(
      {
        error: draftSave.error || "Unable to persist blog edits",
        validationErrors: draftSave.validationErrors,
      },
      { status: draftSave.validationErrors.length > 0 ? 422 : 500 },
    );
  }

  const storedBlog = await upsertBlogPost(
    {
      ...finalBlog,
      version: draftSave.structure.version,
      updatedAt: draftSave.structure.updatedAt,
      metadata: {
        ...finalBlog.metadata,
        versionId: draftSave.versionId ?? finalBlog.metadata.versionId,
      },
    },
    user.id,
  );

  return NextResponse.json({
    ok: true,
    blog: storedBlog,
    structure: draftSave.structure,
    versionId: draftSave.versionId,
    validationErrors: [],
  });
}

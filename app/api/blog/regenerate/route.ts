import { type NextRequest, NextResponse } from "next/server";
import { createBlogMetadata } from "@/lib/blog";
import {
  collectBlogQualityNotes,
  getBlogPostByStructureId,
  normalizeBlogPost,
  regenerateBlogPost,
  upsertBlogPost,
  type BlogGenerationInput,
} from "@/lib/blog";
import { saveEditorStructureDraft } from "@/lib/editor/storage";
import { logger } from "@/lib/observability";
import { getServerUser } from "@/lib/supabase/server";

interface RegenerateBlogBody {
  structureId?: string;
  scope?: "full" | "section";
  sectionId?: string;
  updatedInput?: Partial<BlogGenerationInput>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RegenerateBlogBody;
  try {
    body = (await request.json()) as RegenerateBlogBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim()) {
    return NextResponse.json({ error: "structureId is required" }, { status: 400 });
  }

  const existingBlog = await getBlogPostByStructureId(body.structureId, user.id);
  if (!existingBlog) {
    return NextResponse.json({ error: "Blog not found" }, { status: 404 });
  }

  try {
    const regenerated = await regenerateBlogPost(existingBlog, user.id, {
      scope: body.scope,
      sectionId: body.sectionId,
      updatedInput: body.updatedInput,
    });

    const draftSave = await saveEditorStructureDraft(user.id, regenerated.structure);
    if (!draftSave.structure || draftSave.error) {
      return NextResponse.json(
        {
          error: draftSave.error || "Unable to persist regenerated blog structure",
          validationErrors: draftSave.validationErrors,
        },
        { status: draftSave.validationErrors.length > 0 ? 422 : 500 },
      );
    }

    const normalizedBlog = normalizeBlogPost({
      ...regenerated.blog,
      structureId: draftSave.structure.id,
      version: draftSave.structure.version,
      updatedAt: draftSave.structure.updatedAt,
    });
    const qualityNotes = collectBlogQualityNotes(normalizedBlog);
    const storedBlog = await upsertBlogPost(
      {
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
          versionId: draftSave.versionId ?? normalizedBlog.metadata.versionId,
        }),
      },
      user.id,
    );

    return NextResponse.json({
      blog: storedBlog,
      structure: draftSave.structure,
      versionId: draftSave.versionId,
      usedFallback: regenerated.usedFallback,
      validationErrors: regenerated.validationErrors,
    });
  } catch (error) {
    logger.error("blog regenerate route failed", {
      category: "error",
      service: "openai",
      structureId: body.structureId,
      error: {
        name: "BlogRegenerateRouteError",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json({ error: "Blog regeneration failed" }, { status: 500 });
  }
}

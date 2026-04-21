import { type NextRequest, NextResponse } from "next/server";
import { storeWebsiteStructure } from "@/lib/ai/structure";
import { persistWebsiteStructureArtifacts } from "@/lib/editor/storage";
import {
  createBlogMetadata,
  collectBlogQualityNotes,
  generateBlogPost,
  normalizeBlogPost,
  sanitizeBlogGenerationInput,
  upsertBlogPost,
  validateBlogGenerationInput,
} from "@/lib/blog";
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

  const input = sanitizeBlogGenerationInput(body as Parameters<typeof sanitizeBlogGenerationInput>[0]);
  const errors = validateBlogGenerationInput(input);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Invalid input", details: errors }, { status: 422 });
  }

  try {
    const result = await generateBlogPost(input, user.id);
    const storedStructure = await storeWebsiteStructure(result.structure);
    await persistWebsiteStructureArtifacts(storedStructure, user.id);
    const versionRecord = await createWebsiteVersion({
      structure: storedStructure,
      userId: user.id,
      source: "generate",
      status: "draft",
      label: createWebsiteVersionLabel("generate", storedStructure),
    });
    const normalizedBlog = normalizeBlogPost({
      ...result.blog,
      structureId: storedStructure.id,
      version: storedStructure.version,
      generatedAt: storedStructure.generatedAt,
      updatedAt: storedStructure.updatedAt,
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
          versionId: versionRecord.id,
        }),
      },
      user.id,
    );

    return NextResponse.json({
      blog: storedBlog,
      structure: storedStructure,
      versionId: versionRecord.id,
      previewPath: `/preview/${storedStructure.id}?page=/${storedBlog.slug}`,
      usedFallback: result.usedFallback,
      validationErrors: result.validationErrors,
    });
  } catch (error) {
    logger.error("blog generate route failed", {
      category: "error",
      service: "openai",
      error: {
        name: "BlogGenerateRouteError",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return NextResponse.json({ error: "Blog generation failed" }, { status: 500 });
  }
}

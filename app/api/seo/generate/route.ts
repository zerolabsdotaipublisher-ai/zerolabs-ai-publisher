import { type NextRequest, NextResponse } from "next/server";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure/storage";
import { generateWebsiteSeo, getWebsiteSeoMetadata, storeWebsiteSeoMetadata, type SeoGenerationOptions } from "@/lib/ai/seo";
import {
  createArticleMetadata,
  createArticleSeoMetadata,
  getArticleByStructureId,
  mapArticleToWebsiteStructure,
  upsertArticle,
  validateGeneratedArticle,
} from "@/lib/article";
import {
  createBlogMetadata,
  createBlogSeoMetadata,
  getBlogPostByStructureId,
  mapBlogToWebsiteStructure,
  upsertBlogPost,
  validateGeneratedBlogPost,
} from "@/lib/blog";
import { saveEditorStructureDraft } from "@/lib/editor/storage";
import { logger } from "@/lib/observability";
import { getServerUser } from "@/lib/supabase/server";

interface GenerateSeoBody {
  structureId?: string;
  contentType?: "website" | "blog" | "article";
  updatedInput?: Record<string, unknown>;
  options?: SeoGenerationOptions;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: GenerateSeoBody;
  try {
    body = (await request.json()) as GenerateSeoBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim()) {
    return NextResponse.json({ error: "structureId is required" }, { status: 400 });
  }

  const structure = await getWebsiteStructure(body.structureId, user.id);
  if (!structure) {
    return NextResponse.json({ error: "Structure not found" }, { status: 404 });
  }

  const contentType = body.contentType ?? (structure.websiteType === "blog" ? "blog" : structure.websiteType === "article" ? "article" : "website");

  try {
    if (contentType === "website") {
      const input = {
        ...structure.sourceInput,
        ...(body.updatedInput ?? {}),
      };
      const result = await generateWebsiteSeo(input, structure, user.id, {
        ...body.options,
        version: structure.version,
      });
      const updatedStructure = await updateWebsiteStructure(result.mappedStructure);
      const storedSeo = await storeWebsiteSeoMetadata({
        ...result.seo,
        structureId: updatedStructure.id,
        version: updatedStructure.version,
        updatedAt: updatedStructure.updatedAt,
      });

      return NextResponse.json({
        seo: storedSeo,
        structure: updatedStructure,
        usedFallback: result.usedFallback,
        validationErrors: result.validationErrors,
      });
    }

    if (contentType === "blog") {
      const existing = await getBlogPostByStructureId(body.structureId, user.id);
      if (!existing) {
        return NextResponse.json({ error: "Blog not found" }, { status: 404 });
      }

      const nextSeo = createBlogSeoMetadata({
        title: existing.title,
        slug: existing.slug,
        excerpt: existing.excerpt,
        keywords: existing.sourceInput.keywords,
        sections: existing.sections,
        tags: existing.sourceInput.tags,
        targetAudience: existing.sourceInput.targetAudience,
        searchIntent: existing.sourceInput.seo?.searchIntent,
        keywordInput: existing.sourceInput.seo,
        internalLinkCandidates: structure.pages.map((page) => ({ href: page.slug, title: page.title, type: page.type })),
        targetWordCount: existing.requirements.targetWordCount,
      });
      const now = new Date().toISOString();
      const nextBlog = {
        ...existing,
        seo: nextSeo,
        updatedAt: now,
      };
      const draftSave = await saveEditorStructureDraft(user.id, mapBlogToWebsiteStructure(nextBlog, user.id));
      if (!draftSave.structure || draftSave.error) {
        return NextResponse.json({ error: draftSave.error || "Unable to persist SEO draft", validationErrors: draftSave.validationErrors }, { status: draftSave.validationErrors.length > 0 ? 422 : 500 });
      }
      const storedBlog = await upsertBlogPost(
        {
          ...nextBlog,
          version: draftSave.structure.version,
          updatedAt: draftSave.structure.updatedAt,
          metadata: createBlogMetadata({
            input: nextBlog.sourceInput,
            generatedAt: nextBlog.generatedAt,
            updatedAt: draftSave.structure.updatedAt,
            sections: nextBlog.sections,
            introduction: nextBlog.introduction,
            conclusion: nextBlog.conclusion,
            callToAction: nextBlog.callToAction,
            qualityNotes: validateGeneratedBlogPost(nextBlog),
            versionId: draftSave.versionId ?? nextBlog.metadata.versionId,
          }),
        },
        user.id,
      );

      return NextResponse.json({
        blog: storedBlog,
        structure: draftSave.structure,
        seo: storedBlog.seo,
        validationErrors: validateGeneratedBlogPost(storedBlog),
      });
    }

    const existing = await getArticleByStructureId(body.structureId, user.id);
    if (!existing) {
      return NextResponse.json({ error: "Article not found" }, { status: 404 });
    }

    const nextSeo = createArticleSeoMetadata({
      title: existing.title,
      subtitle: existing.subtitle,
      slug: existing.slug,
      excerpt: existing.excerpt,
      keywords: existing.sourceInput.keywords,
      sections: existing.sections,
      tags: existing.sourceInput.tags,
      targetAudience: existing.sourceInput.targetAudience,
      searchIntent: existing.sourceInput.seo?.searchIntent,
      keywordInput: existing.sourceInput.seo,
      internalLinkCandidates: structure.pages.map((page) => ({ href: page.slug, title: page.title, type: page.type })),
      externalReferenceCandidates: existing.references?.map((reference) => ({ label: reference.title, url: reference.url, reason: reference.note ?? reference.source ?? "Suggested supporting reference" })),
      targetWordCount: existing.requirements.targetWordCount,
    });
    const now = new Date().toISOString();
    const nextArticle = {
      ...existing,
      seo: nextSeo,
      updatedAt: now,
    };
    const draftSave = await saveEditorStructureDraft(user.id, mapArticleToWebsiteStructure(nextArticle, user.id));
    if (!draftSave.structure || draftSave.error) {
      return NextResponse.json({ error: draftSave.error || "Unable to persist SEO draft", validationErrors: draftSave.validationErrors }, { status: draftSave.validationErrors.length > 0 ? 422 : 500 });
    }
    const storedArticle = await upsertArticle(
      {
        ...nextArticle,
        version: draftSave.structure.version,
        updatedAt: draftSave.structure.updatedAt,
        metadata: createArticleMetadata({
          input: nextArticle.sourceInput,
          generatedAt: nextArticle.generatedAt,
          updatedAt: draftSave.structure.updatedAt,
          title: nextArticle.title,
          subtitle: nextArticle.subtitle,
          sections: nextArticle.sections,
          introduction: nextArticle.introduction,
          conclusion: nextArticle.conclusion,
          callToAction: nextArticle.callToAction,
          references: nextArticle.references,
          qualityNotes: validateGeneratedArticle(nextArticle),
          versionId: draftSave.versionId ?? nextArticle.metadata.versionId,
        }),
      },
      user.id,
    );

    return NextResponse.json({
      article: storedArticle,
      structure: draftSave.structure,
      seo: storedArticle.seo,
      validationErrors: validateGeneratedArticle(storedArticle),
    });
  } catch (error) {
    logger.error("seo generate route failed", {
      category: "error",
      service: "seo",
      structureId: body.structureId,
      error: {
        name: "SeoGenerateRouteError",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });

    const fallbackSeo = await getWebsiteSeoMetadata(body.structureId, user.id).catch(() => null);
    return NextResponse.json({ error: "SEO generation failed", seo: fallbackSeo ?? undefined }, { status: 500 });
  }
}

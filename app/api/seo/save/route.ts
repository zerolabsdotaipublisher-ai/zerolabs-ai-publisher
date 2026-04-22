import { type NextRequest, NextResponse } from "next/server";
import { getWebsiteStructure } from "@/lib/ai/structure/storage";
import {
  createArticleMetadata,
  getArticleByStructureId,
  upsertArticle,
  validateGeneratedArticle,
} from "@/lib/article";
import {
  createBlogMetadata,
  getBlogPostByStructureId,
  upsertBlogPost,
  validateGeneratedBlogPost,
} from "@/lib/blog";
import { saveEditorStructureDraft } from "@/lib/editor/storage";
import {
  applySeoOverrideToArticle,
  applySeoOverrideToBlog,
  applySeoOverrideToStructure,
  type SeoContentMetadata,
} from "@/lib/seo";
import { mapArticleToWebsiteStructure } from "@/lib/article";
import { mapBlogToWebsiteStructure } from "@/lib/blog";
import { getServerUser } from "@/lib/supabase/server";

interface SaveSeoBody {
  structureId?: string;
  contentType?: "website" | "blog" | "article";
  pageSlug?: string;
  override?: Partial<SeoContentMetadata>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SaveSeoBody;
  try {
    body = (await request.json()) as SaveSeoBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim() || !body.override) {
    return NextResponse.json({ error: "structureId and override are required" }, { status: 400 });
  }

  const structure = await getWebsiteStructure(body.structureId, user.id);
  if (!structure) {
    return NextResponse.json({ error: "Structure not found" }, { status: 404 });
  }

  const contentType = body.contentType ?? (structure.websiteType === "blog" ? "blog" : structure.websiteType === "article" ? "article" : "website");
  const pageSlug = body.pageSlug ?? body.override.slug ?? structure.pages[0]?.slug ?? "/";

  if (contentType === "website") {
    const nextStructure = applySeoOverrideToStructure({ structure, pageSlug, override: body.override });
    const saved = await saveEditorStructureDraft(user.id, nextStructure);
    if (!saved.structure || saved.error) {
      return NextResponse.json({ error: saved.error || "Unable to save SEO override", validationErrors: saved.validationErrors }, { status: saved.validationErrors.length > 0 ? 422 : 500 });
    }

    return NextResponse.json({ ok: true, structure: saved.structure, pageSlug });
  }

  if (contentType === "blog") {
    const blog = await getBlogPostByStructureId(body.structureId, user.id);
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const nextBlog = applySeoOverrideToBlog(blog, body.override);
    const saved = await saveEditorStructureDraft(user.id, mapBlogToWebsiteStructure(nextBlog, user.id));
    if (!saved.structure || saved.error) {
      return NextResponse.json({ error: saved.error || "Unable to save SEO override", validationErrors: saved.validationErrors }, { status: saved.validationErrors.length > 0 ? 422 : 500 });
    }
    const storedBlog = await upsertBlogPost(
      {
        ...nextBlog,
        version: saved.structure.version,
        updatedAt: saved.structure.updatedAt,
        metadata: createBlogMetadata({
          input: nextBlog.sourceInput,
          generatedAt: nextBlog.generatedAt,
          updatedAt: saved.structure.updatedAt,
          sections: nextBlog.sections,
          introduction: nextBlog.introduction,
          conclusion: nextBlog.conclusion,
          callToAction: nextBlog.callToAction,
          qualityNotes: validateGeneratedBlogPost(nextBlog),
          versionId: saved.versionId ?? nextBlog.metadata.versionId,
        }),
      },
      user.id,
    );

    return NextResponse.json({ ok: true, blog: storedBlog, structure: saved.structure, pageSlug });
  }

  const article = await getArticleByStructureId(body.structureId, user.id);
  if (!article) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  const nextArticle = applySeoOverrideToArticle(article, body.override);
  const saved = await saveEditorStructureDraft(user.id, mapArticleToWebsiteStructure(nextArticle, user.id));
  if (!saved.structure || saved.error) {
    return NextResponse.json({ error: saved.error || "Unable to save SEO override", validationErrors: saved.validationErrors }, { status: saved.validationErrors.length > 0 ? 422 : 500 });
  }
  const storedArticle = await upsertArticle(
    {
      ...nextArticle,
      version: saved.structure.version,
      updatedAt: saved.structure.updatedAt,
      metadata: createArticleMetadata({
        input: nextArticle.sourceInput,
        generatedAt: nextArticle.generatedAt,
        updatedAt: saved.structure.updatedAt,
        title: nextArticle.title,
        subtitle: nextArticle.subtitle,
        sections: nextArticle.sections,
        introduction: nextArticle.introduction,
        conclusion: nextArticle.conclusion,
        callToAction: nextArticle.callToAction,
        references: nextArticle.references,
        qualityNotes: validateGeneratedArticle(nextArticle),
        versionId: saved.versionId ?? nextArticle.metadata.versionId,
      }),
    },
    user.id,
  );

  return NextResponse.json({ ok: true, article: storedArticle, structure: saved.structure, pageSlug });
}

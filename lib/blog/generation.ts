import "server-only";

import { config } from "@/config";
import { generateValidatedWebsiteNavigation } from "@/lib/ai/navigation";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";
import type { PageSeo, WebsitePage, WebsiteSection, WebsiteStructure } from "@/lib/ai/structure";
import { validateWebsiteStructure } from "@/lib/ai/structure";
import { logger } from "@/lib/observability";
import { withRegeneratedWebsiteRouting } from "@/lib/routing";
import { generateSeoContentMetadata } from "@/lib/seo";
import {
  buildBlogGenerationPrompt,
  buildBlogSectionPrompt,
  buildBlogSystemPrompt,
} from "./prompts";
import {
  createBlogMetadata,
  createBlogSeoMetadata,
  resolveSectionCount,
  slugify,
  targetWordCount,
} from "./seo";
import {
  collectBlogQualityNotes,
  normalizeBlogPost,
  sanitizeBlogGenerationInput,
  validateBlogGenerationInput,
  validateGeneratedBlogPost,
} from "./validation";
import type {
  BlogGenerationInput,
  BlogGenerationResult,
  BlogPostSection,
  BlogRegenerationOptions,
  GeneratedBlogPost,
} from "./types";

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

interface SectionRegenerationResponse {
  section?: BlogPostSection;
}

function generateId(prefix: string): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${ts}_${rnd}`;
}

function parseJson<T>(raw: string): T | null {
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed) as T;
  } catch {
    const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (!fenceMatch?.[1]) {
      return null;
    }

    try {
      return JSON.parse(fenceMatch[1]) as T;
    } catch {
      return null;
    }
  }
}

async function callOpenAI(messages: Array<{ role: "system" | "user"; content: string }>): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.services.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.services.openai.model,
      temperature: 0.4,
      response_format: {
        type: "json_object",
      },
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${text}`);
  }

  const data = (await response.json()) as OpenAIChatResponse;
  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return content;
}

function toWebsiteGenerationInput(input: BlogGenerationInput): WebsiteGenerationInput {
  return {
    websiteType: "blog",
    brandName: input.brandName ?? input.siteTitle,
    description: input.summary ?? input.topic,
    targetAudience: input.targetAudience,
    tone: input.tone,
    style: input.style ?? "editorial",
    primaryCta: input.callToAction ?? "Read the article",
    services: input.keywords,
    seo: input.seo,
  };
}

function buildFallbackSections(input: BlogGenerationInput): BlogPostSection[] {
  const sectionCount = resolveSectionCount(input.length, input.sectionCount);
  const topics = [
    `Why ${input.topic} matters now`,
    `How to plan ${input.topic} for ${input.targetAudience}`,
    `SEO guardrails for ${input.topic}`,
    `How to edit and publish ${input.topic}`,
    `How to measure ${input.topic} results`,
    `Common mistakes in ${input.topic}`,
  ];

  return Array.from({ length: sectionCount }).map((_, index) => {
    const keyword = input.keywords[index % input.keywords.length] ?? input.topic;
    return {
      id: `section_${index + 1}`,
      heading: topics[index] ?? `${input.topic} section ${index + 1}`,
      summary: `A concise overview of ${keyword} for ${input.targetAudience}.`,
      paragraphs: [
        `${input.topic} should connect the reader problem, the desired outcome, and a clear next step without drifting away from the main topic.`,
        `Use ${keyword} naturally in headings and supporting copy so the article stays readable, relevant, and ready for search-focused publishing.`,
      ],
      h3Headings: [`Apply ${keyword} intentionally`],
      focusKeyword: keyword,
    };
  });
}

function createFallbackBlogPost(input: BlogGenerationInput): GeneratedBlogPost {
  const now = new Date().toISOString();
  const title = `${input.topic}: a practical guide for ${input.targetAudience}`;
  const slug = slugify(title);
  const excerpt = input.summary
    ? input.summary
    : `Learn how ${input.topic} helps ${input.targetAudience} create structured, SEO-aware blog content that is ready for preview and publishing.`;
  const sections = buildFallbackSections(input);
  const seo = createBlogSeoMetadata({
    title,
    slug,
    excerpt,
    keywords: input.keywords,
    sections,
    tags: input.tags,
    targetAudience: input.targetAudience,
    searchIntent: input.seo?.searchIntent,
    keywordInput: input.seo,
    internalLinkCandidates: [
      { href: "/", title: "Blog", type: "home" },
      { href: `/${slug}`, title, type: "blog" },
    ],
    targetWordCount: targetWordCount(input.length),
  });
  const qualityNotes = [
    "Fallback content used because structured AI output was unavailable.",
  ];

  return {
    id: generateId("blog"),
    structureId: generateId("ws"),
    siteTitle: input.siteTitle,
    title,
    slug,
    excerpt,
    introduction: `This guide explains how ${input.topic} supports ${input.targetAudience} with a structured workflow that balances speed, SEO, and editorial control.`,
    sections,
    conclusion: `${input.topic} works best when generation, validation, preview, and publishing stay connected in one system.`,
    callToAction: input.callToAction ?? "Preview the draft and refine the highest-impact sections.",
    seo,
    metadata: createBlogMetadata({
      input,
      generatedAt: now,
      updatedAt: now,
      sections,
      introduction: `This guide explains how ${input.topic} supports ${input.targetAudience} with a structured workflow that balances speed, SEO, and editorial control.`,
      conclusion: `${input.topic} works best when generation, validation, preview, and publishing stay connected in one system.`,
      callToAction: input.callToAction ?? "Preview the draft and refine the highest-impact sections.",
      qualityNotes,
    }),
    requirements: {
      tone: input.tone,
      style: input.style ?? "editorial",
      length: input.length,
      targetWordCount: targetWordCount(input.length),
      sectionCount: resolveSectionCount(input.length, input.sectionCount),
    },
    sourceInput: input,
    version: 1,
    generatedAt: now,
    updatedAt: now,
    scheduledPublishAt: input.publishAt,
    publishedAt: undefined,
  };
}

function mapListingPageSeo(blog: GeneratedBlogPost): PageSeo {
  const optimization = generateSeoContentMetadata({
    contentType: "website-page",
    title: `${blog.siteTitle} Blog`,
    slug: "/",
    summary: blog.excerpt,
    keywords: blog.metadata.tags,
    keywordInput: blog.sourceInput.seo,
    targetAudience: blog.sourceInput.targetAudience,
    searchIntent: blog.sourceInput.seo?.searchIntent,
    headings: {
      h1: blog.siteTitle,
      h2: ["Latest article"],
      h3: [],
    },
    bodyText: [blog.excerpt, blog.introduction, blog.callToAction],
    targetWordCount: Math.max(600, Math.floor(blog.requirements.targetWordCount * 0.5)),
    internalLinkCandidates: [{ href: `/${blog.slug}`, title: blog.title, type: "blog" }],
  });

  return {
    title: optimization.titleTag,
    description: optimization.metaDescription,
    keywords: [optimization.keywordStrategy.primaryKeyword, ...optimization.keywordStrategy.secondaryKeywords],
    canonicalUrl: `${config.app.url}/site/${blog.structureId}`,
    openGraph: {
      title: optimization.titleTag,
      description: optimization.metaDescription,
      type: "website",
      url: `${config.app.url}/site/${blog.structureId}`,
    },
    contentOptimization: optimization,
    searchIntent: optimization.keywordStrategy.searchIntent,
  };
}

function mapArticlePageSeo(blog: GeneratedBlogPost): PageSeo {
  const canonicalUrl = `${config.app.url}/site/${blog.structureId}/${blog.slug}`;

  return {
    title: blog.seo.metaTitle,
    description: blog.seo.metaDescription,
    keywords: [blog.seo.focusKeyword, ...blog.seo.secondaryKeywords],
    canonicalUrl,
    openGraph: {
      title: blog.seo.metaTitle,
      description: blog.seo.metaDescription,
      type: "article",
      url: canonicalUrl,
    },
    contentOptimization: blog.seo.optimization,
    searchIntent: blog.seo.optimization?.keywordStrategy.searchIntent,
  };
}

function buildPages(blog: GeneratedBlogPost): WebsitePage[] {
  const homeSections: WebsiteSection[] = [
    {
      id: "home_hero",
      type: "hero",
      order: 0,
      visible: true,
      content: {
        headline: blog.siteTitle,
        subheadline: blog.excerpt,
        primaryCta: "Read latest post",
        secondaryCta: "Preview article",
      },
    },
    {
      id: "home_blog_index",
      type: "custom",
      order: 1,
      visible: true,
      content: {
        kind: "blog-index",
        headline: "Latest article",
        posts: [
          {
            id: blog.id,
            title: blog.title,
            slug: `/${blog.slug}`,
            excerpt: blog.excerpt,
            tags: blog.metadata.tags,
            readingTimeMinutes: blog.metadata.readingTimeMinutes,
          },
        ],
      },
    },
    {
      id: "home_footer",
      type: "footer",
      order: 2,
      visible: true,
      content: {
        shortBlurb: blog.callToAction,
        legalText: `© ${new Date(blog.generatedAt).getFullYear()} ${blog.siteTitle}`,
      },
    },
  ];

  const articleSections: WebsiteSection[] = [
    {
      id: "article_header",
      type: "custom",
      order: 0,
      visible: true,
      content: {
        kind: "blog-post-header",
        title: blog.title,
        excerpt: blog.excerpt,
        introduction: blog.introduction,
        authorName: blog.metadata.authorName,
        updatedAt: blog.updatedAt,
        versionId: blog.metadata.versionId,
        readingTimeMinutes: blog.metadata.readingTimeMinutes,
        qualityStatus: blog.metadata.qualityStatus,
        tags: blog.metadata.tags,
      },
    },
    {
      id: "article_body",
      type: "custom",
      order: 1,
      visible: true,
      content: {
        kind: "blog-post-body",
        sections: blog.sections,
        conclusion: blog.conclusion,
        callToAction: blog.callToAction,
      },
    },
  ];

  return [
    {
      id: "page_home",
      slug: "/",
      title: "Blog",
      type: "home",
      sections: homeSections,
      seo: mapListingPageSeo(blog),
      order: 0,
      parentPageId: null,
      depth: 0,
      priority: 0,
      visible: true,
      navigation: {
        includeInHeader: true,
        includeInFooter: true,
        includeInSidebar: false,
      },
      navigationLabel: "Blog",
    },
    {
      id: "page_post",
      slug: `/${blog.slug}`,
      title: blog.title,
      type: "custom",
      sections: articleSections,
      seo: mapArticlePageSeo(blog),
      order: 1,
      parentPageId: null,
      depth: 0,
      priority: 10,
      visible: true,
      navigation: {
        includeInHeader: true,
        includeInFooter: true,
        includeInSidebar: false,
      },
      navigationLabel: blog.title,
    },
  ];
}

export function mapBlogToWebsiteStructure(blog: GeneratedBlogPost, userId: string): WebsiteStructure {
  const pages = buildPages(blog);
  const navigationResult = generateValidatedWebsiteNavigation({
    websiteType: "blog",
    siteTitle: blog.siteTitle,
    pages: pages.map((page) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      type: page.type,
      order: page.order,
      visible: page.visible ?? true,
      parentPageId: page.parentPageId,
      priority: page.priority,
      includeInNavigation:
        page.navigation?.includeInHeader ||
        page.navigation?.includeInFooter ||
        page.navigation?.includeInSidebar ||
        false,
      navigationLabel: page.navigationLabel,
    })),
  });

  const now = blog.updatedAt;
  const base: WebsiteStructure = {
    id: blog.structureId,
    userId,
    websiteType: "blog",
    siteTitle: blog.siteTitle,
    tagline: blog.excerpt,
    pages,
    navigation: navigationResult.navigation,
    seo: {
      title: blog.seo.metaTitle,
      description: blog.seo.metaDescription,
      keywords: [blog.seo.focusKeyword, ...blog.seo.secondaryKeywords],
      canonicalBaseUrl: `${config.app.url}/site/${blog.structureId}`,
      openGraph: {
        title: blog.seo.metaTitle,
        description: blog.seo.metaDescription,
        type: "article",
        url: `${config.app.url}/site/${blog.structureId}/${blog.slug}`,
      },
      contentOptimization: blog.seo.optimization,
      searchIntent: blog.seo.optimization?.keywordStrategy.searchIntent,
    },
    styleConfig: {
      tone: blog.requirements.tone,
      style: blog.requirements.style,
      colorMood: "Editorial neutrals with subtle accent color",
      typographyMood: "Readable editorial hierarchy",
    },
    sourceInput: toWebsiteGenerationInput(blog.sourceInput),
    status: "draft",
    version: blog.version,
    generatedAt: blog.generatedAt,
    updatedAt: now,
    management: {
      displayName: blog.title,
      description: blog.excerpt,
      deletionState: "active",
    },
  };

  return withRegeneratedWebsiteRouting(base, now).structure;
}

function withNormalizedMetadata(blog: GeneratedBlogPost): GeneratedBlogPost {
  const normalized = normalizeBlogPost(blog);
  const qualityNotes = collectBlogQualityNotes(normalized);

  return {
    ...normalized,
    metadata: createBlogMetadata({
      input: normalized.sourceInput,
      generatedAt: normalized.generatedAt,
      updatedAt: normalized.updatedAt,
      sections: normalized.sections,
      introduction: normalized.introduction,
      conclusion: normalized.conclusion,
      callToAction: normalized.callToAction,
      qualityNotes,
      versionId: normalized.metadata.versionId,
    }),
  };
}

export async function generateBlogPost(
  rawInput: BlogGenerationInput,
  userId: string,
): Promise<BlogGenerationResult> {
  const input = sanitizeBlogGenerationInput(rawInput);
  const inputErrors = validateBlogGenerationInput(input);
  if (inputErrors.length > 0) {
    throw new Error(inputErrors.join("; "));
  }

  let blog = createFallbackBlogPost(input);
  let usedFallback = true;

  try {
    const raw = await callOpenAI([
      { role: "system", content: buildBlogSystemPrompt() },
      { role: "user", content: buildBlogGenerationPrompt(input) },
    ]);
    const parsed = parseJson<Omit<GeneratedBlogPost, "id" | "structureId" | "version" | "generatedAt" | "updatedAt">>(raw);

    if (parsed) {
      blog = withNormalizedMetadata({
        ...blog,
        ...parsed,
        id: generateId("blog"),
        structureId: generateId("ws"),
        version: 1,
        generatedAt: blog.generatedAt,
        updatedAt: blog.updatedAt,
        sourceInput: input,
        requirements: {
          tone: input.tone,
          style: input.style ?? "editorial",
          length: input.length,
          targetWordCount: targetWordCount(input.length),
          sectionCount: resolveSectionCount(input.length, input.sectionCount),
        },
        scheduledPublishAt: parsed.scheduledPublishAt ?? input.publishAt,
        publishedAt: parsed.publishedAt,
      });
      usedFallback = false;
    }
  } catch (error) {
    logger.warn("Structured blog generation failed; using fallback", {
      category: "service_call",
      service: "openai",
      error: {
        name: "BlogGenerationFallback",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  const structure = mapBlogToWebsiteStructure(blog, userId);
  const validationErrors = [
    ...validateGeneratedBlogPost(blog),
    ...validateWebsiteStructure(structure),
  ];

  return { blog, structure, validationErrors, usedFallback };
}

export async function regenerateBlogPost(
  existing: GeneratedBlogPost,
  userId: string,
  options: BlogRegenerationOptions = {},
): Promise<BlogGenerationResult> {
  const mergedInput = sanitizeBlogGenerationInput({
    ...existing.sourceInput,
    ...options.updatedInput,
    keywords: options.updatedInput?.keywords ?? existing.sourceInput.keywords,
  });

  const scope = options.scope ?? "full";
  const now = new Date().toISOString();

  if (scope === "section" && options.sectionId) {
    const raw = await callOpenAI([
      { role: "system", content: buildBlogSystemPrompt() },
      {
        role: "user",
        content: buildBlogSectionPrompt(
          {
            ...existing,
            sourceInput: mergedInput,
          },
          options,
        ),
      },
    ]);
    const parsed = parseJson<SectionRegenerationResponse>(raw);
    const nextSection =
      parsed?.section && parsed.section.id === options.sectionId
        ? parsed.section
        : buildFallbackSections(mergedInput).find((section) => section.id === options.sectionId) ??
          buildFallbackSections(mergedInput)[0];

    const updatedBlog = withNormalizedMetadata({
      ...existing,
      sections: existing.sections.map((section) =>
        section.id === options.sectionId ? nextSection : section,
      ),
      sourceInput: mergedInput,
      updatedAt: now,
      version: existing.version + 1,
      scheduledPublishAt: mergedInput.publishAt ?? existing.scheduledPublishAt,
    });
    const structure = mapBlogToWebsiteStructure(updatedBlog, userId);

    return {
      blog: updatedBlog,
      structure,
      validationErrors: [
        ...validateGeneratedBlogPost(updatedBlog),
        ...validateWebsiteStructure(structure),
      ],
      usedFallback: !parsed?.section,
    };
  }

  const generated = await generateBlogPost(mergedInput, userId);
  const blog = {
    ...generated.blog,
    id: existing.id,
    structureId: existing.structureId,
    generatedAt: existing.generatedAt,
    updatedAt: now,
    version: existing.version + 1,
    metadata: {
      ...generated.blog.metadata,
      versionId: existing.metadata.versionId,
    },
    scheduledPublishAt: mergedInput.publishAt ?? existing.scheduledPublishAt,
    publishedAt: existing.publishedAt,
  };
  const normalizedBlog = withNormalizedMetadata(blog);
  const structure = mapBlogToWebsiteStructure(normalizedBlog, userId);

  return {
    blog: normalizedBlog,
    structure,
    validationErrors: [
      ...validateGeneratedBlogPost(normalizedBlog),
      ...validateWebsiteStructure(structure),
    ],
    usedFallback: generated.usedFallback,
  };
}

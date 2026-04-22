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
  buildArticleGenerationPrompt,
  buildArticleSectionPrompt,
  buildArticleSystemPrompt,
} from "./prompts";
import {
  createArticleMetadata,
  createArticleSeoMetadata,
  resolveSectionCount,
  slugify,
  targetWordCount,
} from "./seo";
import {
  collectArticleQualityNotes,
  normalizeArticle,
  sanitizeArticleGenerationInput,
  validateArticleGenerationInput,
  validateGeneratedArticle,
} from "./validation";
import type {
  ArticleGenerationInput,
  ArticleGenerationResult,
  ArticleReference,
  ArticleRegenerationOptions,
  ArticleSection,
  GeneratedArticle,
} from "./types";

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

interface SectionRegenerationResponse {
  section?: ArticleSection;
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
      temperature: 0.35,
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

function toWebsiteGenerationInput(input: ArticleGenerationInput): WebsiteGenerationInput {
  return {
    websiteType: "article",
    brandName: input.brandName ?? input.siteTitle,
    description: input.summary ?? input.topic,
    targetAudience: input.targetAudience,
    tone: input.tone,
    style: input.style ?? "editorial",
    primaryCta: input.callToAction ?? "Read the article",
    services: input.keywords,
    constraints: [
      `article_type:${input.articleType}`,
      `article_depth:${input.depth}`,
      `article_length:${input.length}`,
    ],
    seo: input.seo,
  };
}

function buildFallbackReferences(input: ArticleGenerationInput): ArticleReference[] | undefined {
  if (!input.includeReferences) {
    return undefined;
  }

  if (input.references?.length) {
    return input.references;
  }

  return [
    {
      title: `${input.topic} editorial brief`,
      source: input.brandName ?? input.siteTitle,
      note: "Suggested internal reference generated from the article brief.",
    },
  ];
}

function buildFallbackSections(input: ArticleGenerationInput): ArticleSection[] {
  const sectionCount = resolveSectionCount(input.length, input.sectionCount);
  const outline = input.outline?.length ? input.outline : undefined;
  const templatesByType: Record<ArticleGenerationInput["articleType"], string[]> = {
    guide: [
      `Define the problem behind ${input.topic}`,
      `Build an outline for ${input.topic}`,
      `Draft sections with SEO and clarity in mind`,
      `Review quality before publishing ${input.topic}`,
      `Publish and improve ${input.topic} iteratively`,
    ],
    "long-form-article": [
      `Why ${input.topic} matters now`,
      `What the audience needs to understand first`,
      `Key drivers shaping ${input.topic}`,
      `Where teams struggle with ${input.topic}`,
      `How to turn ${input.topic} into execution`,
    ],
    "thought-leadership": [
      `The current conversation around ${input.topic}`,
      `A stronger point of view on ${input.topic}`,
      `How leaders can act on ${input.topic}`,
      `What separates signal from noise`,
      `What changes next`,
    ],
    "news-style": [
      `What happened`,
      `Why it matters`,
      `What this changes for ${input.targetAudience}`,
      `How teams should respond`,
      `What to watch next`,
    ],
  };
  const defaults = templatesByType[input.articleType];

  return Array.from({ length: sectionCount }).map((_, index) => {
    const keyword = input.keywords[index % input.keywords.length] ?? input.topic;
    const heading = outline?.[index] ?? defaults[index] ?? `${input.topic} section ${index + 1}`;
    return {
      id: `section_${index + 1}`,
      heading,
      summary: `A clear explanation of ${keyword} for ${input.targetAudience}.`,
      paragraphs: [
        `${input.topic} should connect reader intent, editorial structure, and search visibility so the article remains useful and publishable.`,
        `Use ${keyword} naturally while keeping the copy specific enough for ${input.targetAudience} and aligned with the requested ${input.depth} depth.`,
      ],
      h3Headings: [`How ${keyword} applies in practice`],
      takeaways: [
        `Keep ${keyword} tied to a clear editorial point of view.`,
        "Preserve structure so the article remains easy to edit and publish.",
      ],
      focusKeyword: keyword,
    };
  });
}

function createFallbackArticle(input: ArticleGenerationInput): GeneratedArticle {
  const now = new Date().toISOString();
  const title = `${input.topic}: ${input.articleType.replace(/-/g, " ")} for ${input.targetAudience}`;
  const subtitle = `A ${input.depth} ${input.length} article built for ${input.targetAudience} with SEO-aware structure and editorial control.`;
  const slug = slugify(title);
  const excerpt = input.summary
    ? input.summary
    : `Learn how ${input.topic} helps ${input.targetAudience} create structured, SEO-aware long-form content that is ready for preview, editing, and publishing.`;
  const sections = buildFallbackSections(input);
  const references = buildFallbackReferences(input);
  const seo = createArticleSeoMetadata({
    title,
    subtitle,
    slug,
    excerpt,
    keywords: input.keywords,
    sections,
    tags: input.tags,
    targetAudience: input.targetAudience,
    searchIntent: input.seo?.searchIntent,
    keywordInput: input.seo,
    internalLinkCandidates: [
      { href: "/", title: "Articles", type: "home" },
      { href: `/${slug}`, title, type: "article" },
    ],
    externalReferenceCandidates: references?.map((reference) => ({
      label: reference.title,
      url: reference.url,
      reason: reference.note ?? reference.source ?? "Suggested supporting reference",
    })),
    targetWordCount: targetWordCount(input.length),
  });
  const qualityNotes = ["Fallback content used because structured AI output was unavailable."];

  return {
    id: generateId("article"),
    structureId: generateId("ws"),
    siteTitle: input.siteTitle,
    articleType: input.articleType,
    title,
    subtitle,
    slug,
    excerpt,
    introduction: `This article explains how ${input.topic} supports ${input.targetAudience} with a product-owned workflow that balances structure, SEO, and editorial control.`,
    sections,
    conclusion: `${input.topic} works best when generation, validation, preview, and publishing stay connected in one system.`,
    callToAction: input.callToAction ?? "Preview the draft and refine the highest-impact sections.",
    references,
    seo,
    metadata: createArticleMetadata({
      input,
      generatedAt: now,
      updatedAt: now,
      title,
      subtitle,
      sections,
      introduction: `This article explains how ${input.topic} supports ${input.targetAudience} with a product-owned workflow that balances structure, SEO, and editorial control.`,
      conclusion: `${input.topic} works best when generation, validation, preview, and publishing stay connected in one system.`,
      callToAction: input.callToAction ?? "Preview the draft and refine the highest-impact sections.",
      references,
      qualityNotes,
    }),
    requirements: {
      articleType: input.articleType,
      tone: input.tone,
      style: input.style ?? "editorial",
      depth: input.depth,
      length: input.length,
      targetWordCount: targetWordCount(input.length),
      sectionCount: resolveSectionCount(input.length, input.sectionCount),
      citationsEnabled: Boolean(input.includeReferences),
    },
    sourceInput: input,
    version: 1,
    generatedAt: now,
    updatedAt: now,
    scheduledPublishAt: input.publishAt,
    publishedAt: undefined,
  };
}

function mapListingPageSeo(article: GeneratedArticle): PageSeo {
  const optimization = generateSeoContentMetadata({
    contentType: "website-page",
    title: `${article.siteTitle} Articles`,
    slug: "/",
    summary: article.excerpt,
    keywords: article.metadata.tags,
    keywordInput: article.sourceInput.seo,
    targetAudience: article.sourceInput.targetAudience,
    searchIntent: article.sourceInput.seo?.searchIntent,
    headings: {
      h1: article.siteTitle,
      h2: ["Featured article"],
      h3: [],
    },
    bodyText: [article.subtitle, article.excerpt, article.callToAction],
    targetWordCount: Math.max(700, Math.floor(article.requirements.targetWordCount * 0.5)),
    internalLinkCandidates: [{ href: `/${article.slug}`, title: article.title, type: "article" }],
  });

  return {
    title: optimization.titleTag,
    description: optimization.metaDescription,
    keywords: [optimization.keywordStrategy.primaryKeyword, ...optimization.keywordStrategy.secondaryKeywords],
    canonicalUrl: `${config.app.url}/site/${article.structureId}`,
    openGraph: {
      title: optimization.titleTag,
      description: optimization.metaDescription,
      type: "website",
      url: `${config.app.url}/site/${article.structureId}`,
    },
    contentOptimization: optimization,
    searchIntent: optimization.keywordStrategy.searchIntent,
  };
}

function mapArticlePageSeo(article: GeneratedArticle): PageSeo {
  const canonicalUrl = `${config.app.url}/site/${article.structureId}/${article.slug}`;

  return {
    title: article.seo.metaTitle,
    description: article.seo.metaDescription,
    keywords: [article.seo.focusKeyword, ...article.seo.secondaryKeywords],
    canonicalUrl,
    openGraph: {
      title: article.seo.metaTitle,
      description: article.seo.metaDescription,
      type: "article",
      url: canonicalUrl,
    },
    contentOptimization: article.seo.optimization,
    searchIntent: article.seo.optimization?.keywordStrategy.searchIntent,
  };
}

function buildPages(article: GeneratedArticle): WebsitePage[] {
  const homeSections: WebsiteSection[] = [
    {
      id: "home_hero",
      type: "hero",
      order: 0,
      visible: true,
      content: {
        headline: article.siteTitle,
        subheadline: article.subtitle,
        primaryCta: "Read featured article",
        secondaryCta: "Preview article",
      },
    },
    {
      id: "home_article_index",
      type: "custom",
      order: 1,
      visible: true,
      content: {
        kind: "article-index",
        headline: "Featured article",
        posts: [
          {
            id: article.id,
            title: article.title,
            subtitle: article.subtitle,
            slug: `/${article.slug}`,
            excerpt: article.excerpt,
            tags: article.metadata.tags,
            readingTimeMinutes: article.metadata.readingTimeMinutes,
            articleType: article.articleType,
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
        shortBlurb: article.callToAction,
        legalText: `© ${new Date(article.generatedAt).getFullYear()} ${article.siteTitle}`,
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
        kind: "article-page-header",
        title: article.title,
        subtitle: article.subtitle,
        excerpt: article.excerpt,
        introduction: article.introduction,
        authorName: article.metadata.authorName,
        updatedAt: article.updatedAt,
        versionId: article.metadata.versionId,
        readingTimeMinutes: article.metadata.readingTimeMinutes,
        qualityStatus: article.metadata.qualityStatus,
        tags: article.metadata.tags,
        articleType: article.articleType,
        depth: article.requirements.depth,
      },
    },
    {
      id: "article_body",
      type: "custom",
      order: 1,
      visible: true,
      content: {
        kind: "article-page-body",
        sections: article.sections,
        conclusion: article.conclusion,
        callToAction: article.callToAction,
      },
    },
  ];

  if (article.references?.length) {
    articleSections.push({
      id: "article_references",
      type: "custom",
      order: 2,
      visible: true,
      content: {
        kind: "article-page-references",
        headline: "References",
        references: article.references,
      },
    });
  }

  return [
    {
      id: "page_home",
      slug: "/",
      title: "Articles",
      type: "home",
      sections: homeSections,
      seo: mapListingPageSeo(article),
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
      navigationLabel: "Articles",
    },
    {
      id: "page_article",
      slug: `/${article.slug}`,
      title: article.title,
      type: "custom",
      sections: articleSections,
      seo: mapArticlePageSeo(article),
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
      navigationLabel: article.title,
    },
  ];
}

export function mapArticleToWebsiteStructure(article: GeneratedArticle, userId: string): WebsiteStructure {
  const pages = buildPages(article);
  const navigationResult = generateValidatedWebsiteNavigation({
    websiteType: "article",
    siteTitle: article.siteTitle,
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

  const now = article.updatedAt;
  const base: WebsiteStructure = {
    id: article.structureId,
    userId,
    websiteType: "article",
    siteTitle: article.siteTitle,
    tagline: article.subtitle,
    pages,
    navigation: navigationResult.navigation,
    seo: {
      title: article.seo.metaTitle,
      description: article.seo.metaDescription,
      keywords: [article.seo.focusKeyword, ...article.seo.secondaryKeywords],
      canonicalBaseUrl: `${config.app.url}/site/${article.structureId}`,
      openGraph: {
        title: article.seo.metaTitle,
        description: article.seo.metaDescription,
        type: "article",
        url: `${config.app.url}/site/${article.structureId}/${article.slug}`,
      },
      contentOptimization: article.seo.optimization,
      searchIntent: article.seo.optimization?.keywordStrategy.searchIntent,
    },
    styleConfig: {
      tone: article.requirements.tone,
      style: article.requirements.style,
      colorMood: "Editorial neutrals with subtle accent color",
      typographyMood: "Readable editorial hierarchy",
    },
    sourceInput: toWebsiteGenerationInput(article.sourceInput),
    status: "draft",
    version: article.version,
    generatedAt: article.generatedAt,
    updatedAt: now,
    management: {
      displayName: article.title,
      description: article.excerpt,
      deletionState: "active",
    },
  };

  return withRegeneratedWebsiteRouting(base, now).structure;
}

function withNormalizedMetadata(article: GeneratedArticle): GeneratedArticle {
  const normalized = normalizeArticle(article);
  const qualityNotes = collectArticleQualityNotes(normalized);

  return {
    ...normalized,
    metadata: createArticleMetadata({
      input: normalized.sourceInput,
      generatedAt: normalized.generatedAt,
      updatedAt: normalized.updatedAt,
      title: normalized.title,
      subtitle: normalized.subtitle,
      sections: normalized.sections,
      introduction: normalized.introduction,
      conclusion: normalized.conclusion,
      callToAction: normalized.callToAction,
      references: normalized.references,
      qualityNotes,
      versionId: normalized.metadata.versionId,
    }),
  };
}

export async function generateArticle(
  rawInput: ArticleGenerationInput,
  userId: string,
): Promise<ArticleGenerationResult> {
  const input = sanitizeArticleGenerationInput(rawInput);
  const inputErrors = validateArticleGenerationInput(input);
  if (inputErrors.length > 0) {
    throw new Error(inputErrors.join("; "));
  }

  let article = createFallbackArticle(input);
  let usedFallback = true;

  try {
    const raw = await callOpenAI([
      { role: "system", content: buildArticleSystemPrompt() },
      { role: "user", content: buildArticleGenerationPrompt(input) },
    ]);
    const parsed = parseJson<
      Omit<GeneratedArticle, "id" | "structureId" | "version" | "generatedAt" | "updatedAt">
    >(raw);

    if (parsed) {
      article = withNormalizedMetadata({
        ...article,
        ...parsed,
        id: generateId("article"),
        structureId: generateId("ws"),
        version: 1,
        generatedAt: article.generatedAt,
        updatedAt: article.updatedAt,
        sourceInput: input,
        articleType: parsed.articleType ?? input.articleType,
        requirements: {
          articleType: input.articleType,
          tone: input.tone,
          style: input.style ?? "editorial",
          depth: input.depth,
          length: input.length,
          targetWordCount: targetWordCount(input.length),
          sectionCount: resolveSectionCount(input.length, input.sectionCount),
          citationsEnabled: Boolean(input.includeReferences),
        },
        references: parsed.references ?? buildFallbackReferences(input),
        scheduledPublishAt: parsed.scheduledPublishAt ?? input.publishAt,
        publishedAt: parsed.publishedAt,
      });
      usedFallback = false;
    }
  } catch (error) {
    logger.warn("Structured article generation failed; using fallback", {
      category: "service_call",
      service: "openai",
      error: {
        name: "ArticleGenerationFallback",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  const structure = mapArticleToWebsiteStructure(article, userId);
  const validationErrors = [
    ...validateGeneratedArticle(article),
    ...validateWebsiteStructure(structure),
  ];

  return { article, structure, validationErrors, usedFallback };
}

export async function regenerateArticle(
  existing: GeneratedArticle,
  userId: string,
  options: ArticleRegenerationOptions = {},
): Promise<ArticleGenerationResult> {
  const mergedInput = sanitizeArticleGenerationInput({
    ...existing.sourceInput,
    ...options.updatedInput,
    keywords: options.updatedInput?.keywords ?? existing.sourceInput.keywords,
    outline: options.updatedInput?.outline ?? existing.sourceInput.outline,
    references: options.updatedInput?.references ?? existing.sourceInput.references,
  });

  const scope = options.scope ?? "full";
  const now = new Date().toISOString();

  if (scope === "section" && options.sectionId) {
    const raw = await callOpenAI([
      { role: "system", content: buildArticleSystemPrompt() },
      {
        role: "user",
        content: buildArticleSectionPrompt(
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

    const updatedArticle = withNormalizedMetadata({
      ...existing,
      articleType: mergedInput.articleType,
      sections: existing.sections.map((section) =>
        section.id === options.sectionId ? nextSection : section,
      ),
      sourceInput: mergedInput,
      updatedAt: now,
      version: existing.version + 1,
      requirements: {
        ...existing.requirements,
        articleType: mergedInput.articleType,
        tone: mergedInput.tone,
        style: mergedInput.style ?? existing.requirements.style,
        depth: mergedInput.depth,
        length: mergedInput.length,
        targetWordCount: targetWordCount(mergedInput.length),
        sectionCount: resolveSectionCount(mergedInput.length, mergedInput.sectionCount),
        citationsEnabled: Boolean(mergedInput.includeReferences),
      },
      references: mergedInput.includeReferences ? existing.references ?? buildFallbackReferences(mergedInput) : undefined,
      scheduledPublishAt: mergedInput.publishAt ?? existing.scheduledPublishAt,
    });
    const structure = mapArticleToWebsiteStructure(updatedArticle, userId);

    return {
      article: updatedArticle,
      structure,
      validationErrors: [
        ...validateGeneratedArticle(updatedArticle),
        ...validateWebsiteStructure(structure),
      ],
      usedFallback: !parsed?.section,
    };
  }

  const generated = await generateArticle(mergedInput, userId);
  const article = {
    ...generated.article,
    id: existing.id,
    structureId: existing.structureId,
    generatedAt: existing.generatedAt,
    updatedAt: now,
    version: existing.version + 1,
    metadata: {
      ...generated.article.metadata,
      versionId: existing.metadata.versionId,
    },
    scheduledPublishAt: mergedInput.publishAt ?? existing.scheduledPublishAt,
    publishedAt: existing.publishedAt,
  };
  const normalizedArticle = withNormalizedMetadata(article);
  const structure = mapArticleToWebsiteStructure(normalizedArticle, userId);

  return {
    article: normalizedArticle,
    structure,
    validationErrors: [
      ...validateGeneratedArticle(normalizedArticle),
      ...validateWebsiteStructure(structure),
    ],
    usedFallback: generated.usedFallback,
  };
}

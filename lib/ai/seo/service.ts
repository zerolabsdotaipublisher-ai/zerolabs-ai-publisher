import { config, routes } from "@/config";
import { logger } from "@/lib/observability";
import type { WebsiteGenerationInput } from "../prompts/types";
import type { WebsiteStructure } from "../structure/types";
import { buildCanonicalUrl } from "./canonical";
import { normalizeSeoDescription } from "./descriptions";
import {
  createFallbackPageDescription,
  createFallbackWebsiteSeoPackage,
  createSeoGenerationContexts,
} from "./fallback";
import { buildOpenGraphMetadata } from "./og";
import { applySeoOverrides } from "./overrides";
import { buildWebsiteSeoPrompt } from "./prompts";
import { getSeoStrategyForPageType } from "./strategy";
import { normalizeSeoTitle, createFallbackPageTitle } from "./titles";
import type {
  GeneratedPageMetadata,
  SeoGenerationOptions,
  SeoGenerationResult,
  WebsiteSeoPackage,
} from "./types";
import { validateGeneratedWebsiteSeo } from "./validation";

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

interface ParsedSeoPayload {
  site?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
  pages?: Array<{
    pageSlug?: string;
    title?: string;
    description?: string;
    keywords?: string[];
  }>;
}

async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.services.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.services.openai.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as OpenAIChatResponse;
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned empty SEO content response");
  }

  return content;
}

function parseJson(raw: string): ParsedSeoPayload {
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed) as ParsedSeoPayload;
  } catch {
    // continue
  }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);

  if (fence?.[1]) {
    try {
      return JSON.parse(fence[1]) as ParsedSeoPayload;
    } catch {
      // continue
    }
  }

  return {};
}

function normalizeKeywords(values: string[] | undefined, fallback: string[]): string[] {
  const deduped = Array.from(
    new Set((values || []).map((value) => value.trim()).filter(Boolean)),
  );

  return (deduped.length > 0 ? deduped : fallback).slice(0, 12);
}

function applySeoToStructure(structure: WebsiteStructure, seo: WebsiteSeoPackage): WebsiteStructure {
  const siteSeo = {
    ...structure.seo,
    title: seo.site.title,
    description: seo.site.description,
    keywords: seo.site.keywords,
    canonicalBaseUrl: seo.site.canonicalBaseUrl,
    openGraph: seo.site.defaultOpenGraph,
  };

  return {
    ...structure,
    seo: siteSeo,
    pages: structure.pages.map((page) => {
      const pageMetadata = seo.pages.find((candidate) => candidate.pageSlug === page.slug);
      if (!pageMetadata) return page;

      return {
        ...page,
        seo: {
          ...page.seo,
          title: pageMetadata.title,
          description: pageMetadata.description,
          keywords: pageMetadata.keywords,
          canonicalUrl: pageMetadata.canonicalUrl,
          openGraph: pageMetadata.openGraph,
        },
      };
    }),
    updatedAt: seo.updatedAt,
  };
}

function normalizePageMetadata(args: {
  structure: WebsiteStructure;
  input: WebsiteGenerationInput;
  fallbackPages: GeneratedPageMetadata[];
  parsed: ParsedSeoPayload;
}): GeneratedPageMetadata[] {
  return args.fallbackPages.map((fallbackPage) => {
    const parsedPage = args.parsed.pages?.find((page) => page.pageSlug === fallbackPage.pageSlug);
    const structurePage = args.structure.pages.find((page) => page.slug === fallbackPage.pageSlug);
    const context = {
      pageType: fallbackPage.pageType,
      pageTitle: structurePage?.title ?? fallbackPage.title,
      sectionHeadlines:
        structurePage?.sections
          .map((section) => {
            const contentHeadline = (section.content as { headline?: string }).headline;
            return typeof contentHeadline === "string" ? contentHeadline : section.type;
          })
          .slice(0, 4) ?? [],
    };

    const titleFallback = createFallbackPageTitle(args.input.brandName, context);
    const descriptionFallback = createFallbackPageDescription(args.input.brandName, context);

    const title = normalizeSeoTitle(parsedPage?.title || "", titleFallback);
    const description = normalizeSeoDescription(parsedPage?.description || "", descriptionFallback);

    const canonicalUrl = buildCanonicalUrl(
      config.app.url,
      routes.generatedSite(args.structure.id),
      fallbackPage.pageSlug,
    );

    const strategy = getSeoStrategyForPageType(fallbackPage.pageType);
    const keywords = normalizeKeywords(parsedPage?.keywords, [
      args.input.brandName,
      ...strategy.keywordHints,
      ...fallbackPage.keywords,
    ]);

    return {
      ...fallbackPage,
      title,
      description,
      canonicalUrl,
      keywords,
      openGraph: buildOpenGraphMetadata({
        title,
        description,
        canonicalUrl,
        type: fallbackPage.pageType === "custom" ? "article" : "website",
      }),
    };
  });
}

export async function generateWebsiteSeo(
  input: WebsiteGenerationInput,
  structure: WebsiteStructure,
  userId: string,
  options?: SeoGenerationOptions,
): Promise<SeoGenerationResult> {
  const maxSectionsPerPage = options?.maxSectionsPerPage ?? 4;
  const selectedSlugs = options?.pages?.length ? new Set(options.pages) : null;

  const fallback = createFallbackWebsiteSeoPackage({
    structure,
    input,
    userId,
    version: options?.version ?? structure.version,
    maxSectionsPerPage,
  });

  const pagesToGenerate = selectedSlugs
    ? fallback.pages.filter((page) => selectedSlugs.has(page.pageSlug))
    : fallback.pages;

  const contextPages = createSeoGenerationContexts(structure, maxSectionsPerPage).filter((page) =>
    pagesToGenerate.some((candidate) => candidate.pageSlug === page.pageSlug),
  );

  logger.info("Starting website SEO generation", {
    category: "service_call",
    service: "openai",
    structureId: structure.id,
    pageCount: contextPages.length,
  });

  try {
    const prompt = buildWebsiteSeoPrompt({ input, pages: contextPages });
    const maxRetries = options?.maxRetries ?? 2;
    let parsed: ParsedSeoPayload = {};

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const raw = await callOpenAI(prompt);
      parsed = parseJson(raw);

      if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        break;
      }

      if (attempt === maxRetries) {
        logger.warn("Website SEO generation exhausted retries", {
          category: "service_call",
          service: "openai",
          structureId: structure.id,
          maxRetries,
        });
      }
    }

    const normalizedPages = normalizePageMetadata({
      structure,
      input,
      fallbackPages: pagesToGenerate,
      parsed,
    });

    let seo: WebsiteSeoPackage = {
      ...fallback,
      site: {
        ...fallback.site,
        title: normalizeSeoTitle(parsed.site?.title || "", fallback.site.title),
        description: normalizeSeoDescription(
          parsed.site?.description || "",
          fallback.site.description,
        ),
        keywords: normalizeKeywords(parsed.site?.keywords, fallback.site.keywords),
      },
      pages: selectedSlugs
        ? [...fallback.pages.filter((page) => !selectedSlugs.has(page.pageSlug)), ...normalizedPages]
        : normalizedPages,
      updatedAt: new Date().toISOString(),
    };

    seo.site.defaultOpenGraph = buildOpenGraphMetadata({
      title: seo.site.title,
      description: seo.site.description,
      canonicalUrl: buildCanonicalUrl(config.app.url, routes.generatedSite(structure.id), "/"),
      type: "website",
    });

    seo = applySeoOverrides(seo, options?.overrides);

    const validationErrors = validateGeneratedWebsiteSeo(seo);
    if (validationErrors.length > 0) {
      logger.warn("Generated SEO requires fallback recovery", {
        category: "service_call",
        service: "openai",
        structureId: structure.id,
        errorCount: validationErrors.length,
      });

      const fallbackWithOverrides = applySeoOverrides(fallback, options?.overrides);

      return {
        seo: fallbackWithOverrides,
        mappedStructure: applySeoToStructure(structure, fallbackWithOverrides),
        validationErrors,
        usedFallback: true,
      };
    }

    return {
      seo,
      mappedStructure: applySeoToStructure(structure, seo),
      validationErrors,
      usedFallback: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    logger.error("Website SEO generation failed, fallback applied", {
      category: "error",
      service: "openai",
      structureId: structure.id,
      error: { message, name: "GenerateWebsiteSeoError" },
    });

    const fallbackWithOverrides = applySeoOverrides(fallback, options?.overrides);

    return {
      seo: fallbackWithOverrides,
      mappedStructure: applySeoToStructure(structure, fallbackWithOverrides),
      validationErrors: [message],
      usedFallback: true,
    };
  }
}

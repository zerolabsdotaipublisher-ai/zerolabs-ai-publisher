import { config } from "@/config";
import { logger } from "@/lib/observability";
import type { WebsiteGenerationInput } from "../prompts/types";
import type { WebsiteStructure } from "../structure/types";
import { normalizeCtaSection } from "./cta";
import { createFallbackWebsiteContentPackage } from "./fallback";
import { evaluateContentQuality } from "./guardrails";
import { normalizeHeroSectionContent } from "./hero";
import {
  normalizeInformationalSection,
  normalizeServicesSection,
  createAboutFallback,
  createInformationalFallback,
} from "./informational";
import { applyGeneratedContentToStructure, resolvePageGenerationContexts } from "./mapper";
import { normalizeMicrocopy } from "./microcopy";
import { buildWebsiteContentPrompt } from "./prompts";
import { DEFAULT_DENSITY_PRESET, DEFAULT_LENGTH_PRESET } from "./schemas";
import { resolveToneStyleProfile } from "./tone";
import { validateGeneratedWebsiteContent } from "./validation";
import type {
  ContentGenerationOptions,
  ContentGenerationResult,
  ContentSectionType,
  GeneratedPageContent,
  GeneratedSectionContentMap,
  WebsiteContentPackage,
} from "./types";

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

function generateContentId(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `wc_${ts}_${rnd}`;
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
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as OpenAIChatResponse;
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned empty content response");
  }

  return content;
}

function parseJson<T>(raw: string): Partial<T> {
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed) as Partial<T>;
  } catch {
    // continue
  }

  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);

  if (fence?.[1]) {
    try {
      return JSON.parse(fence[1]) as Partial<T>;
    } catch {
      // continue
    }
  }

  return {};
}

function normalizeGeneratedSectionMap(
  sections: Partial<GeneratedSectionContentMap> | undefined,
  input: WebsiteGenerationInput,
): GeneratedSectionContentMap {
  return {
    hero: normalizeHeroSectionContent(sections?.hero, input),
    about: normalizeInformationalSection(sections?.about, createAboutFallback(input)),
    services: normalizeServicesSection(sections?.services, input),
    features: normalizeInformationalSection(
      sections?.features,
      createInformationalFallback("Key features", input),
    ),
    process: normalizeInformationalSection(
      sections?.process,
      createInformationalFallback("Process", input),
    ),
    benefits: normalizeInformationalSection(
      sections?.benefits,
      createInformationalFallback("Benefits", input),
    ),
    testimonials: {
      headline: sections?.testimonials?.headline?.trim() || "Client feedback",
      subheadline:
        sections?.testimonials?.subheadline?.trim() ||
        "Evidence from real projects",
      items:
        sections?.testimonials?.items
          ?.map((item) => ({
            quote: item.quote?.trim(),
            author: item.author?.trim(),
            role: item.role?.trim(),
            isPlaceholder: Boolean(item.isPlaceholder),
          }))
          .filter((item) => item.quote && item.author)
          .slice(0, 4) || [],
    },
    faq: {
      headline:
        sections?.faq?.headline?.trim() || "Frequently asked questions",
      items:
        sections?.faq?.items
          ?.map((item) => ({
            question: item.question?.trim(),
            answer: item.answer?.trim(),
          }))
          .filter((item) => item.question && item.answer)
          .slice(0, 6) || [],
    },
    cta: normalizeCtaSection(sections?.cta, input),
    contact: {
      headline: sections?.contact?.headline?.trim() || "Contact",
      subheadline: sections?.contact?.subheadline?.trim() || undefined,
      channels:
        sections?.contact?.channels
          ?.map((channel) => ({
            label: channel.label?.trim(),
            value: channel.value?.trim(),
          }))
          .filter((channel) => channel.label && channel.value)
          .slice(0, 6) || [],
      helperText: sections?.contact?.helperText?.trim() || undefined,
    },
    footer: {
      shortBlurb: sections?.footer?.shortBlurb?.trim() || `${input.brandName} for ${input.targetAudience}`,
      legalText: sections?.footer?.legalText?.trim() || undefined,
      trustIndicators:
        sections?.footer?.trustIndicators
          ?.map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 4) || undefined,
    },
    microcopy: normalizeMicrocopy(sections?.microcopy, input),
  };
}

function normalizeGeneratedPage(
  candidate: Partial<GeneratedPageContent> | undefined,
  fallback: GeneratedPageContent,
  input: WebsiteGenerationInput,
): GeneratedPageContent {
  return {
    pageSlug: candidate?.pageSlug?.trim() || fallback.pageSlug,
    pageType: candidate?.pageType || fallback.pageType,
    messaging: {
      pageHeadline:
        candidate?.messaging?.pageHeadline?.trim() || fallback.messaging.pageHeadline,
      pageSubheadline:
        candidate?.messaging?.pageSubheadline?.trim() ||
        fallback.messaging.pageSubheadline,
      valueProposition:
        candidate?.messaging?.valueProposition?.trim() ||
        fallback.messaging.valueProposition,
    },
    sections: normalizeGeneratedSectionMap(candidate?.sections, input),
  };
}

function buildPackage(
  structure: WebsiteStructure,
  userId: string,
  input: WebsiteGenerationInput,
  pages: GeneratedPageContent[],
  lengthPreset: WebsiteContentPackage["lengthPreset"],
  densityPreset: WebsiteContentPackage["densityPreset"],
  version = 1,
): WebsiteContentPackage {
  const now = new Date().toISOString();

  return {
    id: generateContentId(),
    structureId: structure.id,
    userId,
    websiteType: structure.websiteType,
    tone: input.tone,
    style: input.style,
    lengthPreset,
    densityPreset,
    pages,
    generatedFromInput: input,
    generatedAt: now,
    updatedAt: now,
    version,
  };
}

export async function generateSectionContent(
  sectionType: ContentSectionType,
  input: WebsiteGenerationInput,
  structure: WebsiteStructure,
  options?: ContentGenerationOptions,
): Promise<GeneratedSectionContentMap[ContentSectionType] | null> {
  const result = await generateWebsiteContent(input, structure, structure.userId, {
    ...options,
    sectionTypes: [sectionType],
  });

  const firstPage = result.content.pages[0];
  if (!firstPage) return null;

  return firstPage.sections[sectionType] ?? null;
}

export async function generateWebsiteContent(
  input: WebsiteGenerationInput,
  structure: WebsiteStructure,
  userId: string,
  options?: ContentGenerationOptions,
): Promise<ContentGenerationResult> {
  const pages = resolvePageGenerationContexts(structure).filter((page) =>
    options?.pages?.length ? options.pages.includes(page.pageSlug) : true,
  );

  const lengthPreset = options?.lengthPreset ?? DEFAULT_LENGTH_PRESET;
  const densityPreset = options?.densityPreset ?? DEFAULT_DENSITY_PRESET;

  const fallbackContent = createFallbackWebsiteContentPackage(
    structure.id,
    userId,
    input.websiteType,
    input,
    pages,
    lengthPreset,
    densityPreset,
  );

  const toneProfile = resolveToneStyleProfile(
    input.tone,
    input.style,
    input.customToneNotes,
    input.customStyleNotes,
  );

  logger.info("Starting website content generation", {
    category: "service_call",
    service: "openai",
    structureId: structure.id,
    pageCount: pages.length,
    tone: toneProfile.tone,
    style: toneProfile.style,
  });

  try {
    const prompt = buildWebsiteContentPrompt({
      input,
      pages,
      lengthPreset,
      densityPreset,
    });

    const retries = options?.maxRetries ?? 2;
    let parsed: Partial<{ pages: Partial<GeneratedPageContent>[] }> = {};

    for (let attempt = 0; attempt <= retries; attempt++) {
      const raw = await callOpenAI(prompt);
      parsed = parseJson<{ pages: Partial<GeneratedPageContent>[] }>(raw);

      if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        break;
      }
    }

    const generatedPages = pages.map((context, index) => {
      const fallbackPage = fallbackContent.pages[index];
      const pageCandidate = parsed.pages?.find(
        (candidate) => candidate.pageSlug === context.pageSlug,
      );

      return normalizeGeneratedPage(pageCandidate, fallbackPage, input);
    });

    let content = buildPackage(
      structure,
      userId,
      input,
      generatedPages,
      lengthPreset,
      densityPreset,
    );

    if (options?.sectionTypes && options.sectionTypes.length > 0) {
      content = {
        ...content,
        pages: content.pages.map((page) => ({
          ...page,
          sections: Object.fromEntries(
            Object.entries(page.sections).filter(([key]) =>
              options.sectionTypes?.includes(key as ContentSectionType),
            ),
          ) as GeneratedSectionContentMap,
        })),
      };
    }

    const validationErrors = [
      ...validateGeneratedWebsiteContent(content),
      ...evaluateContentQuality(content),
    ];

    const usedFallback = validationErrors.length > 0;
    if (usedFallback) {
      logger.warn("Generated content requires fallback recovery", {
        category: "service_call",
        service: "openai",
        structureId: structure.id,
        errorCount: validationErrors.length,
      });

      content = {
        ...fallbackContent,
        id: content.id,
        version: content.version,
      };
    }

    const mappedStructure = applyGeneratedContentToStructure(structure, content);

    return {
      content,
      mappedStructure,
      validationErrors,
      usedFallback,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    logger.error("Website content generation failed, fallback applied", {
      category: "error",
      service: "openai",
      structureId: structure.id,
      error: { message, name: "GenerateWebsiteContentError" },
    });

    return {
      content: fallbackContent,
      mappedStructure: applyGeneratedContentToStructure(structure, fallbackContent),
      validationErrors: [message],
      usedFallback: true,
    };
  }
}

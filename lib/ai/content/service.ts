import { config } from "@/config";
import { logger } from "@/lib/observability";
import type { WebsiteGenerationInput } from "../prompts/types";
import type { WebsiteStructure } from "../structure/types";
import { normalizeCtaSection } from "./cta";
import { createFallbackWebsiteContentPackage, createFooterFallback } from "./fallback";
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
import { normalizePricingSection } from "./pricing";
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

function sectionRequested(
  sectionType: ContentSectionType,
  allowedSections?: ContentSectionType[],
): boolean {
  return !allowedSections?.length || allowedSections.includes(sectionType);
}

function normalizeGeneratedSectionMap(
  sections: Partial<GeneratedSectionContentMap> | undefined,
  input: WebsiteGenerationInput,
  allowedSections?: ContentSectionType[],
): Partial<GeneratedSectionContentMap> {
  const footerFallback = createFooterFallback(input);
  const normalized: Partial<GeneratedSectionContentMap> = {};

  if (sectionRequested("hero", allowedSections)) {
    normalized.hero = normalizeHeroSectionContent(sections?.hero, input);
  }
  if (sectionRequested("about", allowedSections)) {
    normalized.about = normalizeInformationalSection(
      sections?.about,
      createAboutFallback(input),
    );
  }
  if (sectionRequested("services", allowedSections)) {
    normalized.services = normalizeServicesSection(sections?.services, input);
  }
  if (sectionRequested("features", allowedSections)) {
    normalized.features = normalizeInformationalSection(
      sections?.features,
      createInformationalFallback("Key features", input),
    );
  }
  if (sectionRequested("process", allowedSections)) {
    normalized.process = normalizeInformationalSection(
      sections?.process,
      createInformationalFallback("Process", input),
    );
  }
  if (sectionRequested("benefits", allowedSections)) {
    normalized.benefits = normalizeInformationalSection(
      sections?.benefits,
      createInformationalFallback("Benefits", input),
    );
  }
  if (sectionRequested("testimonials", allowedSections)) {
    normalized.testimonials = {
      variant:
        sections?.testimonials?.variant ||
        ((sections?.testimonials?.items?.length ?? 0) > 1
          ? "quote-grid"
          : "single-quote"),
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
            company: item.company?.trim(),
            isPlaceholder:
              item.isPlaceholder ?? !(input.testimonials && input.testimonials.length > 0),
          }))
          .filter((item) => item.quote && item.author)
          .slice(0, 4) || [],
      audience: sections?.testimonials?.audience?.trim() || input.targetAudience,
      tone: sections?.testimonials?.tone || input.tone,
      density: sections?.testimonials?.density || "medium",
      goal: sections?.testimonials?.goal?.trim() || input.primaryCta,
    };
  }
  if (sectionRequested("faq", allowedSections)) {
    normalized.faq = {
      variant: sections?.faq?.variant || "expanded",
      headline: sections?.faq?.headline?.trim() || "Frequently asked questions",
      subheadline: sections?.faq?.subheadline?.trim() || undefined,
      items:
        sections?.faq?.items
          ?.map((item) => ({
            question: item.question?.trim(),
            answer: item.answer?.trim(),
          }))
          .filter((item) => item.question && item.answer)
          .slice(0, 6) || [],
      audience: sections?.faq?.audience?.trim() || input.targetAudience,
      tone: sections?.faq?.tone || input.tone,
      density: sections?.faq?.density || "medium",
      goal: sections?.faq?.goal?.trim() || input.primaryCta,
    };
  }
  if (sectionRequested("cta", allowedSections)) {
    normalized.cta = normalizeCtaSection(sections?.cta, input);
  }
  if (sectionRequested("pricing", allowedSections)) {
    normalized.pricing = normalizePricingSection(sections?.pricing, input);
  }
  if (sectionRequested("contact", allowedSections)) {
    normalized.contact = {
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
    };
  }
  if (sectionRequested("footer", allowedSections)) {
    normalized.footer = {
      shortBlurb:
        sections?.footer?.shortBlurb?.trim() || footerFallback.shortBlurb,
      legalText:
        sections?.footer?.legalText?.trim() || footerFallback.legalText,
      trustIndicators:
        sections?.footer?.trustIndicators
          ?.map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 4) || footerFallback.trustIndicators,
    };
  }
  if (sectionRequested("microcopy", allowedSections)) {
    normalized.microcopy = normalizeMicrocopy(sections?.microcopy, input);
  }

  return normalized;
}

function normalizeGeneratedPage(
  candidate: Partial<GeneratedPageContent> | undefined,
  fallback: GeneratedPageContent,
  input: WebsiteGenerationInput,
  allowedSections?: ContentSectionType[],
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
    sections: normalizeGeneratedSectionMap(candidate?.sections, input, allowedSections),
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
  ).map((page) => ({
    ...page,
    sections: options?.sectionTypes?.length
      ? page.sections.filter((section) => options.sectionTypes?.includes(section))
      : page.sections,
  })).filter((page) => page.sections.length > 0);

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
    options?.sectionTypes,
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
      options,
    });

    const maxRetries = options?.maxRetries ?? 2;
    let parsed: Partial<{ pages: Partial<GeneratedPageContent>[] }> = {};

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const raw = await callOpenAI(prompt);
      parsed = parseJson<{ pages: Partial<GeneratedPageContent>[] }>(raw);

      if (Array.isArray(parsed.pages) && parsed.pages.length > 0) {
        if (attempt > 0) {
          logger.info("Website content generation recovered after retry", {
            category: "service_call",
            service: "openai",
            structureId: structure.id,
            attempt,
          });
        }
        break;
      }

      logger.warn("Website content generation returned empty page payload", {
        category: "service_call",
        service: "openai",
        structureId: structure.id,
        attempt,
      });

      if (attempt === maxRetries) {
        logger.warn("Website content generation exhausted retries", {
          category: "service_call",
          service: "openai",
          structureId: structure.id,
          maxRetries,
        });
      }
    }

    const generatedPages = pages.map((context, index) => {
      const fallbackPage = fallbackContent.pages[index];
      const pageCandidate = parsed.pages?.find(
        (candidate) => candidate.pageSlug === context.pageSlug,
      );

      return normalizeGeneratedPage(
        pageCandidate,
        fallbackPage,
        input,
        options?.sectionTypes,
      );
    });

    let content = buildPackage(
      structure,
      userId,
      input,
      generatedPages,
      lengthPreset,
      densityPreset,
    );

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

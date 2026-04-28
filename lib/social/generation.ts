import "server-only";

import { config } from "@/config";
import { getWebsiteStructure, type TonePreset } from "@/lib/ai/structure";
import { getArticleByStructureId } from "@/lib/article";
import { getBlogPostByStructureId } from "@/lib/blog";
import { logger } from "@/lib/observability";
import {
  SOCIAL_MVP_PLATFORMS,
  getPlatformRules,
} from "./platform-rules";
import {
  buildSocialGenerationPrompt,
  buildSocialRegenerationPrompt,
  buildSocialSystemPrompt,
} from "./prompts";
import {
  collectSocialQualityNotes,
  normalizeSocialPost,
  optimizeVariantForPlatform,
  sanitizeSocialGenerationInput,
  validateGeneratedSocialPost,
  validateSocialGenerationInput,
} from "./validation";
import type {
  GeneratedSocialPost,
  SocialGenerationInput,
  SocialGenerationRequirements,
  SocialGenerationResult,
  SocialPlatform,
  SocialPostVariant,
  SocialRegenerationOptions,
  SocialSourceContentInput,
} from "./types";

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
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
      temperature: 0.5,
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

function defaultCta(goal: string, platform: SocialPlatform): string {
  const rules = getPlatformRules(platform);
  return `Take the next step: ${goal.trim() || rules.ctaHints[0]}.`;
}

function buildHashtags(keywords: string[], platform: SocialPlatform, maxHashtags: number): string[] {
  const rules = getPlatformRules(platform);
  const limit = Math.min(maxHashtags, rules.hashtagLimit);

  return keywords
    .map((keyword) => keyword.trim().replace(/^#+/, ""))
    .map((keyword) => keyword.replace(/[^\p{L}\p{N}_ ]/gu, "").replace(/\s+/g, ""))
    .filter(Boolean)
    .map((keyword) => `#${keyword}`)
    .slice(0, Math.max(1, limit));
}

function buildFallbackVariant(
  platform: SocialPlatform,
  input: SocialGenerationInput,
  sourceSnapshot: { title?: string; summary?: string; body?: string },
): SocialPostVariant {
  const rules = getPlatformRules(platform);
  const lead = sourceSnapshot.summary ?? sourceSnapshot.title ?? input.topic;
  const captionBase = `${lead} Audience: ${input.audience}. Focus: ${input.campaignGoal}.`;
  const caption = input.includeEmoji
    ? `✨ ${captionBase}`
    : captionBase;

  const variant: SocialPostVariant = {
    platform,
    caption,
    hashtags: buildHashtags(input.keywords, platform, input.maxHashtags ?? rules.defaultHashtagCount),
    callToAction: input.callToActionHint ?? defaultCta(input.campaignGoal, platform),
    link: input.optionalUrl,
    mediaReferences: input.mediaReferences ?? [],
    metadata: {
      platform,
      characterLimit: rules.characterLimit,
      hashtagLimit: rules.hashtagLimit,
      supportsLink: rules.supportsLink,
      supportsHashtags: rules.supportsHashtags,
      estimatedLength: caption.length,
      keywordCoverage: [],
      warnings: ["Fallback social variant used"],
    },
  };

  return optimizeVariantForPlatform(variant, input.keywords);
}

function toRequirements(input: SocialGenerationInput, platforms: SocialPlatform[]): SocialGenerationRequirements {
  return {
    tone: input.tone,
    audience: input.audience,
    campaignGoal: input.campaignGoal,
    hashtagStyle: input.hashtagStyle ?? "balanced",
    includeEmoji: input.includeEmoji ?? false,
    maxHashtags: input.maxHashtags ?? 6,
    platforms,
  };
}

async function resolveSourceSnapshot(
  sourceContent: SocialSourceContentInput | undefined,
  userId: string,
): Promise<{
  structureId?: string;
  sourceType: GeneratedSocialPost["sourceType"];
  snapshot: { title?: string; summary?: string; body?: string };
}> {
  if (!sourceContent) {
    return {
      sourceType: "custom",
      snapshot: {},
    };
  }

  const fallback = {
    structureId: sourceContent.structureId,
    sourceType: sourceContent.type,
    snapshot: {
      title: sourceContent.title,
      summary: sourceContent.summary,
      body: sourceContent.body,
    },
  };

  if (!sourceContent.structureId) {
    return fallback;
  }

  if (sourceContent.type === "blog") {
    const blog = await getBlogPostByStructureId(sourceContent.structureId, userId);
    if (!blog) return fallback;

    return {
      structureId: sourceContent.structureId,
      sourceType: "blog",
      snapshot: {
        title: blog.title,
        summary: blog.excerpt,
        body: [blog.introduction, ...blog.sections.flatMap((section) => section.paragraphs), blog.conclusion].join(
          " ",
        ),
      },
    };
  }

  if (sourceContent.type === "article") {
    const article = await getArticleByStructureId(sourceContent.structureId, userId);
    if (!article) return fallback;

    return {
      structureId: sourceContent.structureId,
      sourceType: "article",
      snapshot: {
        title: article.title,
        summary: article.excerpt,
        body: [
          article.introduction,
          ...article.sections.flatMap((section) => section.paragraphs),
          article.conclusion,
        ].join(" "),
      },
    };
  }

  if (sourceContent.type === "website") {
    const structure = await getWebsiteStructure(sourceContent.structureId, userId);
    if (!structure) return fallback;

    return {
      structureId: sourceContent.structureId,
      sourceType: "website",
      snapshot: {
        title: structure.siteTitle,
        summary: structure.tagline,
        body: structure.pages
          .flatMap((page) => page.sections)
          .map((section) => Object.values(section.content).join(" "))
          .join(" "),
      },
    };
  }

  return fallback;
}

function createFallbackSocialPost(
  input: SocialGenerationInput,
  userId: string,
  source: {
    structureId?: string;
    sourceType: GeneratedSocialPost["sourceType"];
    snapshot: { title?: string; summary?: string; body?: string };
  },
): GeneratedSocialPost {
  const now = new Date().toISOString();
  const platforms = input.platforms && input.platforms.length > 0 ? input.platforms : SOCIAL_MVP_PLATFORMS;

  return {
    id: generateId("social"),
    userId,
    structureId: source.structureId,
    topic: input.topic,
    title: source.snapshot.title ?? `${input.topic} campaign social variants`,
    sourceType: source.sourceType,
    sourceSnapshot: source.snapshot,
    variants: platforms.map((platform) => buildFallbackVariant(platform, input, source.snapshot)),
    sharedKeywords: input.keywords,
    requirements: toRequirements(input, platforms),
    validation: {
      isValid: true,
      errors: [],
    },
    regenerationCount: 0,
    generatedAt: now,
    updatedAt: now,
    version: 1,
  };
}

function mergeAiVariants(
  fallbackPost: GeneratedSocialPost,
  parsedPost:
    | (Partial<Omit<GeneratedSocialPost, "id" | "userId" | "generatedAt" | "updatedAt" | "version">> & {
        variants?: SocialPostVariant[];
      })
    | null,
): GeneratedSocialPost {
  if (!parsedPost) {
    return fallbackPost;
  }

  const fallbackByPlatform = new Map(fallbackPost.variants.map((variant) => [variant.platform, variant]));
  const aiByPlatform = new Map((parsedPost.variants ?? []).map((variant) => [variant.platform, variant]));
  const platforms = fallbackPost.requirements.platforms;

  return {
    ...fallbackPost,
    title: parsedPost.title?.trim() || fallbackPost.title,
    variants: platforms.map((platform) => {
      const aiVariant = aiByPlatform.get(platform);
      const fallbackVariant = fallbackByPlatform.get(platform);
      if (!fallbackVariant) {
        throw new Error(`Missing fallback variant for platform ${platform}`);
      }
      if (!aiVariant) {
        return fallbackVariant;
      }

      return {
        ...fallbackVariant,
        ...aiVariant,
        platform,
        mediaReferences: aiVariant.mediaReferences ?? fallbackVariant.mediaReferences,
      };
    }),
    sharedKeywords:
      parsedPost.sharedKeywords?.length && parsedPost.sharedKeywords.some((entry) => entry.trim())
        ? parsedPost.sharedKeywords
        : fallbackPost.sharedKeywords,
  };
}

export async function generateSocialPost(
  rawInput: SocialGenerationInput,
  userId: string,
): Promise<SocialGenerationResult> {
  const input = sanitizeSocialGenerationInput(rawInput);
  const inputErrors = validateSocialGenerationInput(input);
  if (inputErrors.length > 0) {
    throw new Error(inputErrors.join("; "));
  }

  const source = await resolveSourceSnapshot(input.sourceContent, userId);
  const fallbackPost = createFallbackSocialPost(input, userId, source);
  let usedFallback = true;
  let socialPost = fallbackPost;

  try {
    const raw = await callOpenAI([
      { role: "system", content: buildSocialSystemPrompt() },
      { role: "user", content: buildSocialGenerationPrompt(input, source.snapshot) },
    ]);
    const parsed = parseJson<
      Partial<Omit<GeneratedSocialPost, "id" | "userId" | "generatedAt" | "updatedAt" | "version">>
    >(raw);
    socialPost = mergeAiVariants(fallbackPost, parsed);
    usedFallback = false;
  } catch (error) {
    logger.warn("Structured social generation failed; using fallback", {
      category: "service_call",
      service: "openai",
      error: {
        name: "SocialGenerationFallback",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  const normalizedPost = normalizeSocialPost(socialPost);
  const validationErrors = validateGeneratedSocialPost(normalizedPost);
  const qualityNotes = collectSocialQualityNotes(normalizedPost);

  const finalPost: GeneratedSocialPost = {
    ...normalizedPost,
    validation: {
      isValid: validationErrors.length === 0,
      errors: [...validationErrors, ...qualityNotes],
    },
  };

  return {
    socialPost: finalPost,
    usedFallback,
    validationErrors: finalPost.validation.errors,
  };
}

export async function regenerateSocialPost(
  existing: GeneratedSocialPost,
  userId: string,
  options: SocialRegenerationOptions = {},
): Promise<SocialGenerationResult> {
  const mergedInput = sanitizeSocialGenerationInput({
    topic: options.updatedInput?.topic ?? existing.topic,
    keywords: options.updatedInput?.keywords ?? existing.sharedKeywords,
    campaignGoal: options.updatedInput?.campaignGoal ?? existing.requirements.campaignGoal,
    audience: options.updatedInput?.audience ?? existing.requirements.audience,
    tone: (options.updatedInput?.tone ?? existing.requirements.tone) as TonePreset,
    optionalUrl: options.updatedInput?.optionalUrl ?? existing.variants.find((variant) => variant.link)?.link,
    sourceContent: {
      type: options.updatedInput?.sourceContent?.type ?? existing.sourceType,
      structureId: options.updatedInput?.sourceContent?.structureId ?? existing.structureId,
      title: options.updatedInput?.sourceContent?.title ?? existing.sourceSnapshot?.title,
      summary: options.updatedInput?.sourceContent?.summary ?? existing.sourceSnapshot?.summary,
      body: options.updatedInput?.sourceContent?.body ?? existing.sourceSnapshot?.body,
    },
    platforms:
      options.platform
        ? [options.platform]
        : options.updatedInput?.platforms ?? existing.requirements.platforms,
    mediaReferences:
      options.updatedInput?.mediaReferences ??
      existing.variants.flatMap((variant) => variant.mediaReferences),
    hashtagStyle: options.updatedInput?.hashtagStyle ?? existing.requirements.hashtagStyle,
    includeEmoji: options.updatedInput?.includeEmoji ?? existing.requirements.includeEmoji,
    callToActionHint: options.updatedInput?.callToActionHint,
    maxHashtags: options.updatedInput?.maxHashtags ?? existing.requirements.maxHashtags,
  });

  const source = await resolveSourceSnapshot(mergedInput.sourceContent, userId);
  const fallbackPost = createFallbackSocialPost(mergedInput, userId, source);
  const now = new Date().toISOString();
  let regenerated = fallbackPost;
  let usedFallback = true;

  try {
    const raw = await callOpenAI([
      { role: "system", content: buildSocialSystemPrompt() },
      {
        role: "user",
        content: buildSocialRegenerationPrompt(existing, options),
      },
    ]);
    const parsed = parseJson<
      Partial<Omit<GeneratedSocialPost, "id" | "userId" | "generatedAt" | "updatedAt" | "version">>
    >(raw);
    regenerated = mergeAiVariants(fallbackPost, parsed);
    usedFallback = false;
  } catch (error) {
    logger.warn("Social regeneration failed; using fallback", {
      category: "service_call",
      service: "openai",
      error: {
        name: "SocialRegenerationFallback",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });
  }

  const mergedVariants = options.platform
    ? existing.variants.map((variant) =>
        variant.platform === options.platform
          ? regenerated.variants.find((entry) => entry.platform === options.platform) ?? variant
          : variant,
      )
    : regenerated.variants;

  const normalized = normalizeSocialPost({
    ...existing,
    ...regenerated,
    id: existing.id,
    userId,
    structureId: source.structureId ?? existing.structureId,
    sourceType: source.sourceType,
    sourceSnapshot: source.snapshot,
    variants: mergedVariants,
    generatedAt: existing.generatedAt,
    updatedAt: now,
    version: existing.version + 1,
    regenerationCount: existing.regenerationCount + 1,
  });

  const validationErrors = validateGeneratedSocialPost(normalized);

  return {
    socialPost: {
      ...normalized,
      validation: {
        isValid: validationErrors.length === 0,
        errors: validationErrors,
      },
    },
    usedFallback,
    validationErrors,
  };
}

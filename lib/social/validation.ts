import { getPlatformRules } from "./platform-rules";
import type {
  GeneratedSocialPost,
  SocialGenerationInput,
  SocialHashtagStyle,
  SocialPlatform,
  SocialPostVariant,
} from "./types";

const BANNED_PHRASES = ["as an ai", "language model", "game-changing", "revolutionary", "unlock"];
const MIN_WORD_BOUNDARY_INDEX = 40;

function trimOrUndefined(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeIsoTimestamp(value?: string): string | undefined {
  const trimmed = trimOrUndefined(value);
  if (!trimmed) {
    return undefined;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

function normalizeHashtag(value: string): string {
  const cleaned = value.trim().replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "");
  return cleaned ? `#${cleaned}` : "";
}

function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];
  values.forEach((value) => {
    const key = value.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      output.push(value);
    }
  });
  return output;
}

function estimateHashtagCount(style: SocialHashtagStyle): number {
  switch (style) {
    case "minimal":
      return 2;
    case "aggressive":
      return 8;
    default:
      return 5;
  }
}

export function sanitizeSocialGenerationInput(input: SocialGenerationInput): SocialGenerationInput {
  const hashtagStyle = input.hashtagStyle ?? "balanced";

  return {
    ...input,
    topic: input.topic.trim(),
    campaignGoal: input.campaignGoal.trim(),
    audience: input.audience.trim(),
    keywords: dedupe(input.keywords.map((keyword) => keyword.trim()).filter(Boolean)),
    optionalUrl: trimOrUndefined(input.optionalUrl),
    mediaReferences: dedupe((input.mediaReferences ?? []).map((entry) => entry.trim()).filter(Boolean)),
    hashtagStyle,
    includeEmoji: input.includeEmoji ?? false,
    callToActionHint: trimOrUndefined(input.callToActionHint),
    maxHashtags: Math.max(1, Math.min(30, input.maxHashtags ?? estimateHashtagCount(hashtagStyle))),
    sourceContent: input.sourceContent
      ? {
          type: input.sourceContent.type,
          structureId: trimOrUndefined(input.sourceContent.structureId),
          title: trimOrUndefined(input.sourceContent.title),
          summary: trimOrUndefined(input.sourceContent.summary),
          body: trimOrUndefined(input.sourceContent.body),
        }
      : undefined,
    platforms: dedupe(
      (input.platforms ?? ["facebook", "instagram", "x", "linkedin"]).map((platform) => platform),
    ) as SocialPlatform[],
  };
}

export function validateSocialGenerationInput(input: SocialGenerationInput): string[] {
  const errors: string[] = [];

  if (!input.topic.trim()) errors.push("topic is required");
  if (!input.campaignGoal.trim()) errors.push("campaignGoal is required");
  if (!input.audience.trim()) errors.push("audience is required");
  if (!input.keywords.length) errors.push("keywords must include at least one entry");

  const platforms = input.platforms ?? ["facebook", "instagram", "x", "linkedin"];
  if (!platforms.length) {
    errors.push("platforms must include at least one platform");
  }

  if (input.optionalUrl) {
    try {
      const parsed = new URL(input.optionalUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        errors.push("optionalUrl must use http or https");
      }
    } catch {
      errors.push("optionalUrl must be a valid URL");
    }
  }

  if (input.maxHashtags !== undefined && (input.maxHashtags < 1 || input.maxHashtags > 30)) {
    errors.push("maxHashtags must be between 1 and 30");
  }

  if (input.sourceContent?.structureId && !input.sourceContent.type) {
    errors.push("sourceContent.type is required when sourceContent.structureId is provided");
  }

  return errors;
}

function truncateByWordBoundary(value: string, maxLength: number): string {
  if (maxLength <= 0) return "";
  if (value.length <= maxLength) return value;
  const clipped = value.slice(0, Math.max(0, maxLength - 1));
  const lastSpace = clipped.lastIndexOf(" ");
  const safe = lastSpace > MIN_WORD_BOUNDARY_INDEX ? clipped.slice(0, lastSpace) : clipped;
  return `${safe.trimEnd()}…`;
}

function containsBannedPhrase(value: string): boolean {
  const lowered = value.toLowerCase();
  return BANNED_PHRASES.some((phrase) => lowered.includes(phrase));
}

export function optimizeVariantForPlatform(
  variant: SocialPostVariant,
  sharedKeywords: string[],
): SocialPostVariant {
  const rules = getPlatformRules(variant.platform);
  const allowedHashtags = dedupe(variant.hashtags.map(normalizeHashtag).filter(Boolean)).slice(
    0,
    rules.hashtagLimit,
  );
  const caption = truncateByWordBoundary(variant.caption.trim(), rules.characterLimit);
  const link = rules.supportsLink ? trimOrUndefined(variant.link) : undefined;
  const warnings: string[] = [];

  if (variant.caption.length > rules.characterLimit) {
    warnings.push(`Caption truncated to ${rules.characterLimit} chars`);
  }
  if (!rules.supportsLink && variant.link) {
    warnings.push("Link removed because platform does not support clickable links");
  }
  if (containsBannedPhrase(caption) || containsBannedPhrase(variant.callToAction)) {
    warnings.push("Contains banned phrase and should be reviewed");
  }

  const normalized: SocialPostVariant = {
    ...variant,
    caption,
    hashtags: allowedHashtags,
    callToAction: variant.callToAction.trim(),
    link,
    mediaReferences: dedupe(variant.mediaReferences.map((entry) => entry.trim()).filter(Boolean)),
    metadata: {
      platform: variant.platform,
      characterLimit: rules.characterLimit,
      hashtagLimit: rules.hashtagLimit,
      supportsLink: rules.supportsLink,
      supportsHashtags: rules.supportsHashtags,
      estimatedLength: caption.length,
      keywordCoverage: dedupe(
        sharedKeywords.filter((keyword) => {
          const normalizedKeyword = keyword.toLowerCase();
          const body = `${caption} ${variant.callToAction}`.toLowerCase();
          return normalizedKeyword && body.includes(normalizedKeyword);
        }),
      ),
      warnings,
    },
  };

  return normalized;
}

export function validateSocialVariant(variant: SocialPostVariant): string[] {
  const errors: string[] = [];
  const rules = getPlatformRules(variant.platform);

  if (!variant.caption.trim()) errors.push(`${variant.platform}: caption is required`);
  if (variant.caption.length > rules.characterLimit) {
    errors.push(`${variant.platform}: caption exceeds character limit (${rules.characterLimit})`);
  }
  if (!variant.callToAction.trim()) errors.push(`${variant.platform}: callToAction is required`);
  if (variant.hashtags.length > rules.hashtagLimit) {
    errors.push(`${variant.platform}: hashtag count exceeds limit (${rules.hashtagLimit})`);
  }
  if (!rules.supportsLink && variant.link) {
    errors.push(`${variant.platform}: link is not supported`);
  }

  return errors;
}

export function validateGeneratedSocialPost(post: GeneratedSocialPost): string[] {
  const errors: string[] = [];

  if (!post.topic.trim()) errors.push("topic is required");
  if (!post.title.trim()) errors.push("title is required");
  if (!post.variants.length) errors.push("at least one social platform variant is required");

  const seenPlatforms = new Set<SocialPlatform>();
  post.variants.forEach((variant) => {
    if (seenPlatforms.has(variant.platform)) {
      errors.push(`duplicate platform variant: ${variant.platform}`);
      return;
    }
    seenPlatforms.add(variant.platform);
    errors.push(...validateSocialVariant(variant));
  });

  return errors;
}

export function collectSocialQualityNotes(post: GeneratedSocialPost): string[] {
  const notes: string[] = [];

  if (post.variants.some((variant) => !variant.hashtags.length)) {
    notes.push("One or more variants do not include hashtags");
  }

  if (post.variants.some((variant) => variant.metadata.warnings.length > 0)) {
    notes.push("Platform-specific warnings were detected in one or more variants");
  }

  if (
    post.variants.some((variant) =>
      [variant.caption, variant.callToAction].some((value) => containsBannedPhrase(value)),
    )
  ) {
    notes.push("Contains banned filler or AI disclosure phrases");
  }

  return notes;
}

export function normalizeSocialPost(post: GeneratedSocialPost): GeneratedSocialPost {
  const variants = post.variants.map((variant) => optimizeVariantForPlatform(variant, post.sharedKeywords));
  const validationErrors = validateGeneratedSocialPost({ ...post, variants });

  return {
    ...post,
    title: post.title.trim(),
    topic: post.topic.trim(),
    sharedKeywords: dedupe(post.sharedKeywords.map((keyword) => keyword.trim()).filter(Boolean)),
    variants,
    validation: {
      isValid: validationErrors.length === 0,
      errors: validationErrors,
    },
    scheduledPublishAt: normalizeIsoTimestamp(post.scheduledPublishAt),
    publishedAt: normalizeIsoTimestamp(post.publishedAt),
  };
}

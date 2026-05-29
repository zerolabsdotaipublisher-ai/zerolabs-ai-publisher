import type { SocialPostVariant } from "@/lib/social/types";
import type {
  InstagramCanonicalPublishPayload,
  InstagramPublishValidationResult,
} from "./types";

const INSTAGRAM_CAPTION_LIMIT = 2200;
const INSTAGRAM_HASHTAG_LIMIT = 30;
const SUPPORTED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"] as const;

function normalizeUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  try {
    const parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return undefined;
    }
    return parsed.toString();
  } catch {
    return undefined;
  }
}

function isSupportedImageExtension(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return SUPPORTED_IMAGE_EXTENSIONS.some((extension) => pathname.endsWith(extension));
  } catch {
    return false;
  }
}

function countHashtags(caption: string): number {
  const matches = caption.match(/#[\p{L}\p{N}_]+/gu);
  return matches?.length ?? 0;
}

export function formatInstagramCaption(variant: SocialPostVariant): string {
  const lines = [
    variant.caption.trim(),
    variant.callToAction.trim(),
    variant.hashtags.join(" ").trim(),
  ].filter(Boolean);

  const joined = lines.join("\n\n").trim();
  if (joined.length <= INSTAGRAM_CAPTION_LIMIT) {
    return joined;
  }

  const truncated = Array.from(joined).slice(0, INSTAGRAM_CAPTION_LIMIT - 1).join("");
  return `${truncated}…`;
}

export function validateInstagramVariantForPublish(
  variant: SocialPostVariant,
): InstagramPublishValidationResult {
  const errors: string[] = [];
  const mediaUrl = normalizeUrl(variant.mediaReferences[0] ?? "");
  const caption = formatInstagramCaption(variant);

  if (variant.platform !== "instagram") {
    errors.push("Only instagram variants can be published via this flow.");
  }

  if (!mediaUrl) {
    errors.push("Instagram image publishing requires a valid media URL.");
  } else if (!isSupportedImageExtension(mediaUrl)) {
    errors.push("Instagram image publishing supports jpg, jpeg, png, or webp URLs for MVP.");
  }

  if (!caption.trim()) {
    errors.push("Caption is required for Instagram publishing.");
  }

  if (caption.length > INSTAGRAM_CAPTION_LIMIT) {
    errors.push(`Caption exceeds Instagram limit of ${INSTAGRAM_CAPTION_LIMIT} characters.`);
  }

  if (countHashtags(caption) > INSTAGRAM_HASHTAG_LIMIT) {
    errors.push(`Caption exceeds Instagram hashtag limit of ${INSTAGRAM_HASHTAG_LIMIT}.`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    mediaUrl,
    caption,
  };
}

export function validateInstagramCanonicalPayload(
  payload: InstagramCanonicalPublishPayload,
): InstagramPublishValidationResult {
  return validateInstagramVariantForPublish(payload.variant);
}

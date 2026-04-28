import { socialOutputContractJson } from "./schema";
import { getPlatformRules } from "./platform-rules";
import type {
  GeneratedSocialPost,
  SocialGenerationInput,
  SocialPlatform,
  SocialRegenerationOptions,
} from "./types";

const SOCIAL_GUARDRAILS = [
  "Return valid JSON only.",
  "Do not mention being an AI model.",
  "Avoid filler terms such as game-changing, revolutionary, and unlock.",
  "Do not fabricate statistics, customer quotes, or claims.",
  "Keep post copy readable, specific, and audience-aligned.",
];

function buildPlatformRulesSnippet(platforms: SocialPlatform[]): string {
  return platforms
    .map((platform) => {
      const rules = getPlatformRules(platform);
      return [
        `- ${platform}:`,
        `  - characterLimit=${rules.characterLimit}`,
        `  - hashtagLimit=${rules.hashtagLimit}`,
        `  - supportsLink=${String(rules.supportsLink)}`,
        `  - supportsHashtags=${String(rules.supportsHashtags)}`,
        `  - toneHints=${rules.toneHints.join(", ")}`,
      ].join("\n");
    })
    .join("\n");
}

export function buildSocialSystemPrompt(): string {
  return [
    "You generate structured social media post variants for AI Publisher.",
    "Generate one post variant per requested platform from a single content brief.",
    ...SOCIAL_GUARDRAILS.map((rule) => `- ${rule}`),
  ].join("\n");
}

export function buildSocialGenerationPrompt(
  input: SocialGenerationInput,
  sourceContext: { title?: string; summary?: string; body?: string },
): string {
  const platforms = input.platforms ?? ["facebook", "instagram", "x", "linkedin"];

  return [
    "Generate platform-specific social post variants using the JSON contract below.",
    "Use the source content context where provided.",
    "Ensure every requested platform is present exactly once.",
    "",
    "Input:",
    JSON.stringify(input, null, 2),
    "",
    "Source context:",
    JSON.stringify(sourceContext, null, 2),
    "",
    "Platform rules:",
    buildPlatformRulesSnippet(platforms),
    "",
    "Required output contract:",
    socialOutputContractJson(),
    "",
    "Additional rules:",
    "- Keep hashtag arrays deduplicated and relevant.",
    "- Keep CTA outcome-focused and specific.",
    "- If a platform does not support clickable links (e.g. Instagram), omit link.",
    "- For X, keep the caption concise enough to respect the character limit.",
  ].join("\n");
}

export function buildSocialRegenerationPrompt(
  existing: GeneratedSocialPost,
  options: SocialRegenerationOptions,
): string {
  const targetPlatform = options.platform;

  return [
    "Regenerate social content and return JSON with the GeneratedSocialPost shape.",
    targetPlatform
      ? `Regenerate only the ${targetPlatform} variant while preserving all other variants.`
      : "Regenerate all platform variants.",
    "",
    "Existing post:",
    JSON.stringify(existing, null, 2),
    "",
    "Regeneration options:",
    JSON.stringify(options, null, 2),
    "",
    "Rules:",
    "- Keep the same source context and campaign goal.",
    "- Maintain platform-specific constraints.",
    "- Return valid JSON only.",
  ].join("\n");
}

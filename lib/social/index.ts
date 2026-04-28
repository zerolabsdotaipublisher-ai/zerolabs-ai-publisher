export type {
  GeneratedSocialPost,
  SocialGenerationInput,
  SocialGenerationRequirements,
  SocialGenerationResult,
  SocialHashtagStyle,
  SocialPlatform,
  SocialPostRow,
  SocialPostStatus,
  SocialPostVariant,
  SocialPreviewCard,
  SocialPreviewResponse,
  SocialRegenerationOptions,
  SocialSourceContentInput,
  SocialSourceContentType,
} from "./types";

export {
  SOCIAL_REQUIRED_VARIANT_FIELDS,
  SOCIAL_OUTPUT_EXAMPLE,
  socialOutputContractJson,
} from "./schema";

export {
  SOCIAL_MVP_PLATFORMS,
  SOCIAL_PLATFORM_RULES,
  getPlatformRules,
} from "./platform-rules";

export {
  buildSocialGenerationPrompt,
  buildSocialRegenerationPrompt,
  buildSocialSystemPrompt,
} from "./prompts";

export {
  collectSocialQualityNotes,
  normalizeSocialPost,
  optimizeVariantForPlatform,
  sanitizeSocialGenerationInput,
  validateGeneratedSocialPost,
  validateSocialGenerationInput,
  validateSocialVariant,
} from "./validation";

export { generateSocialPost, regenerateSocialPost } from "./generation";

export {
  deleteSocialPostsByStructureId,
  getSocialPostById,
  listSocialPosts,
  listSocialPostsByStructureId,
  upsertSocialPost,
} from "./storage";

export { buildSocialPreviewResponse } from "./preview";

export { socialGenerationScenarios } from "./scenarios";

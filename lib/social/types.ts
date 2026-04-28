import type { TonePreset } from "@/lib/ai/structure";

export type SocialPlatform = "facebook" | "instagram" | "x" | "linkedin";

export type SocialSourceContentType = "website" | "blog" | "article" | "custom";

export type SocialHashtagStyle = "minimal" | "balanced" | "aggressive";

export type SocialPostStatus =
  | "draft"
  | "generated"
  | "edited"
  | "scheduled"
  | "published"
  | "archived"
  | "deleted";

export interface SocialSourceContentInput {
  type: SocialSourceContentType;
  structureId?: string;
  title?: string;
  summary?: string;
  body?: string;
}

export interface SocialGenerationInput {
  topic: string;
  keywords: string[];
  campaignGoal: string;
  audience: string;
  tone: TonePreset;
  optionalUrl?: string;
  sourceContent?: SocialSourceContentInput;
  platforms?: SocialPlatform[];
  mediaReferences?: string[];
  hashtagStyle?: SocialHashtagStyle;
  includeEmoji?: boolean;
  callToActionHint?: string;
  maxHashtags?: number;
}

export interface SocialGenerationRequirements {
  tone: TonePreset;
  audience: string;
  campaignGoal: string;
  hashtagStyle: SocialHashtagStyle;
  includeEmoji: boolean;
  maxHashtags: number;
  platforms: SocialPlatform[];
}

export interface SocialPlatformVariantMetadata {
  platform: SocialPlatform;
  characterLimit: number;
  hashtagLimit: number;
  supportsLink: boolean;
  supportsHashtags: boolean;
  estimatedLength: number;
  keywordCoverage: string[];
  warnings: string[];
}

export interface SocialPostVariant {
  platform: SocialPlatform;
  caption: string;
  hashtags: string[];
  callToAction: string;
  link?: string;
  mediaReferences: string[];
  metadata: SocialPlatformVariantMetadata;
}

export interface SocialPostValidation {
  isValid: boolean;
  errors: string[];
}

export interface GeneratedSocialPost {
  id: string;
  userId: string;
  structureId?: string;
  topic: string;
  title: string;
  sourceType: SocialSourceContentType;
  sourceSnapshot?: {
    title?: string;
    summary?: string;
    body?: string;
  };
  variants: SocialPostVariant[];
  sharedKeywords: string[];
  requirements: SocialGenerationRequirements;
  validation: SocialPostValidation;
  regenerationCount: number;
  generatedAt: string;
  updatedAt: string;
  version: number;
  scheduledPublishAt?: string;
  publishedAt?: string;
}

export interface SocialGenerationResult {
  socialPost: GeneratedSocialPost;
  usedFallback: boolean;
  validationErrors: string[];
}

export interface SocialRegenerationOptions {
  platform?: SocialPlatform;
  reason?: string;
  updatedInput?: Partial<SocialGenerationInput>;
}

export interface SocialPreviewCard {
  platform: SocialPlatform;
  caption: string;
  hashtagsLine: string;
  callToAction: string;
  link?: string;
  characterCount: number;
  characterLimit: number;
  warnings: string[];
}

export interface SocialPreviewResponse {
  socialPost: GeneratedSocialPost;
  cards: SocialPreviewCard[];
  warnings: string[];
}

export interface SocialPostRow {
  id: string;
  user_id: string;
  structure_id?: string | null;
  topic: string;
  title: string;
  source_type: SocialSourceContentType;
  social_json: unknown;
  source_input: unknown;
  content_status?: SocialPostStatus;
  version: number;
  regeneration_count: number;
  created_by?: string | null;
  updated_by?: string | null;
  archived_at?: string | null;
  deleted_at?: string | null;
  generated_at: string;
  updated_at: string;
  scheduled_publish_at?: string | null;
  published_at?: string | null;
}

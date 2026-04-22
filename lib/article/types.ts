import type { StylePreset, TonePreset, WebsiteStructure } from "@/lib/ai/structure";
import type { SeoContentMetadata, SeoKeywordInput } from "@/lib/seo";

export type ArticleType =
  | "long-form-article"
  | "guide"
  | "thought-leadership"
  | "news-style";

export type ArticleDepthPreset = "overview" | "strategic" | "expert";

export type ArticleLengthPreset = "short" | "medium" | "long" | "extended";

export type ArticleQualityStatus = "draft" | "ready" | "needs_review";

export interface ArticleReference {
  title: string;
  source?: string;
  url?: string;
  note?: string;
}

export interface ArticleGenerationRequirements {
  articleType: ArticleType;
  tone: TonePreset;
  style: StylePreset;
  depth: ArticleDepthPreset;
  length: ArticleLengthPreset;
  targetWordCount: number;
  sectionCount: number;
  citationsEnabled: boolean;
}

export interface ArticleGenerationInput {
  siteTitle: string;
  topic: string;
  keywords: string[];
  targetAudience: string;
  articleType: ArticleType;
  tone: TonePreset;
  depth: ArticleDepthPreset;
  length: ArticleLengthPreset;
  style?: StylePreset;
  authorName?: string;
  brandName?: string;
  summary?: string;
  callToAction?: string;
  tags?: string[];
  outline?: string[];
  userContext?: string;
  references?: ArticleReference[];
  includeReferences?: boolean;
  sectionCount?: number;
  publishAt?: string;
  seo?: SeoKeywordInput;
}

export interface ArticleSection {
  id: string;
  heading: string;
  summary: string;
  paragraphs: string[];
  h3Headings?: string[];
  takeaways?: string[];
  focusKeyword?: string;
}

export interface ArticleSeoMetadata {
  metaTitle: string;
  metaDescription: string;
  canonicalPath: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  tags: string[];
  headingOutline: {
    h1: string;
    h2: string[];
    h3: string[];
  };
  suggestedInternalLinks: string[];
  optimization?: SeoContentMetadata;
}

export interface ArticleMetadata {
  authorName: string;
  createdAt: string;
  updatedAt: string;
  versionId?: string;
  readingTimeMinutes: number;
  wordCount: number;
  tags: string[];
  qualityStatus: ArticleQualityStatus;
  qualityNotes: string[];
  targetAudience: string;
  articleType: ArticleType;
  usedOutline: boolean;
  referenceCount: number;
}

export interface GeneratedArticle {
  id: string;
  structureId: string;
  siteTitle: string;
  articleType: ArticleType;
  title: string;
  subtitle: string;
  slug: string;
  excerpt: string;
  introduction: string;
  sections: ArticleSection[];
  conclusion: string;
  callToAction: string;
  references?: ArticleReference[];
  seo: ArticleSeoMetadata;
  metadata: ArticleMetadata;
  requirements: ArticleGenerationRequirements;
  sourceInput: ArticleGenerationInput;
  version: number;
  generatedAt: string;
  updatedAt: string;
  scheduledPublishAt?: string;
  publishedAt?: string;
}

export interface ArticleGenerationResult {
  article: GeneratedArticle;
  structure: WebsiteStructure;
  validationErrors: string[];
  usedFallback: boolean;
}

export interface ArticleRegenerationOptions {
  scope?: "full" | "section";
  sectionId?: string;
  updatedInput?: Partial<ArticleGenerationInput>;
}

export interface ArticlePreviewResponse {
  article: GeneratedArticle;
  previewPath: string;
  pageSlug: string;
  model: {
    id: string;
    currentPageSlug: string;
    currentDeviceMode: string;
    routePath: string;
    previewPath: string;
    generatedSitePath: string;
    pages: Array<{
      id: string;
      title: string;
      slug: string;
      href: string;
      active: boolean;
    }>;
  };
}

export interface ArticleRow {
  id: string;
  structure_id: string;
  user_id: string;
  title: string;
  slug: string;
  article_type: ArticleType;
  article_json: unknown;
  source_input: unknown;
  version: number;
  generated_at: string;
  updated_at: string;
  scheduled_publish_at?: string | null;
  published_at?: string | null;
}

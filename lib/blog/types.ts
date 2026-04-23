import type { StylePreset, TonePreset, WebsiteStructure } from "@/lib/ai/structure";
import type { SeoContentMetadata, SeoKeywordInput } from "@/lib/seo";

export type BlogLengthPreset = "short" | "medium" | "long";

export type BlogQualityStatus = "draft" | "ready" | "needs_review";

export interface BlogGenerationRequirements {
  tone: TonePreset;
  style: StylePreset;
  length: BlogLengthPreset;
  targetWordCount: number;
  sectionCount: number;
}

export interface BlogGenerationInput {
  siteTitle: string;
  topic: string;
  keywords: string[];
  targetAudience: string;
  tone: TonePreset;
  length: BlogLengthPreset;
  style?: StylePreset;
  authorName?: string;
  brandName?: string;
  summary?: string;
  callToAction?: string;
  tags?: string[];
  sectionCount?: number;
  publishAt?: string;
  seo?: SeoKeywordInput;
}

export interface BlogPostSection {
  id: string;
  heading: string;
  summary: string;
  paragraphs: string[];
  h3Headings?: string[];
  focusKeyword?: string;
}

export interface BlogSeoMetadata {
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
  optimization?: SeoContentMetadata;
}

export interface BlogPostMetadata {
  authorName: string;
  createdAt: string;
  updatedAt: string;
  versionId?: string;
  readingTimeMinutes: number;
  wordCount: number;
  tags: string[];
  qualityStatus: BlogQualityStatus;
  qualityNotes: string[];
}

export interface GeneratedBlogPost {
  id: string;
  structureId: string;
  siteTitle: string;
  title: string;
  slug: string;
  excerpt: string;
  introduction: string;
  sections: BlogPostSection[];
  conclusion: string;
  callToAction: string;
  seo: BlogSeoMetadata;
  metadata: BlogPostMetadata;
  requirements: BlogGenerationRequirements;
  sourceInput: BlogGenerationInput;
  version: number;
  generatedAt: string;
  updatedAt: string;
  scheduledPublishAt?: string;
  publishedAt?: string;
}

export interface BlogGenerationResult {
  blog: GeneratedBlogPost;
  structure: WebsiteStructure;
  validationErrors: string[];
  usedFallback: boolean;
}

export interface BlogRegenerationOptions {
  scope?: "full" | "section";
  sectionId?: string;
  updatedInput?: Partial<BlogGenerationInput>;
}

export interface BlogPreviewResponse {
  blog: GeneratedBlogPost;
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
  optimization?: SeoContentMetadata;
}

export interface BlogPostRow {
  id: string;
  structure_id: string;
  user_id: string;
  content_status?: "draft" | "generated" | "edited" | "scheduled" | "published" | "archived" | "deleted";
  created_by?: string | null;
  updated_by?: string | null;
  title: string;
  slug: string;
  blog_json: unknown;
  source_input: unknown;
  version: number;
  archived_at?: string | null;
  deleted_at?: string | null;
  generated_at: string;
  updated_at: string;
  scheduled_publish_at?: string | null;
  published_at?: string | null;
}

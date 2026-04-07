import type {
  PageType,
  SectionType,
  WebsitePage,
  WebsiteStructure,
} from "../structure/types";
import type {
  StylePreset,
  TonePreset,
  WebsiteGenerationInput,
  WebsiteType,
} from "../prompts/types";

export type ContentSectionType =
  | Exclude<SectionType, "custom">
  | "features"
  | "process"
  | "benefits"
  | "faq"
  | "microcopy";

export type ContentLengthPreset = "concise" | "balanced" | "detailed";

export type ContentDensityPreset = "light" | "medium" | "high";

export interface PageGenerationContext {
  pageSlug: string;
  pageType: PageType;
  sections: ContentSectionType[];
}

export interface ContentGenerationOptions {
  pages?: string[];
  sectionTypes?: ContentSectionType[];
  lengthPreset?: ContentLengthPreset;
  densityPreset?: ContentDensityPreset;
  maxRetries?: number;
}

export interface HeroSectionContent {
  headline: string;
  subheadline: string;
  supportingCopy: string;
  primaryCta: string;
  secondaryCta?: string;
}

export interface InformationalSectionContent {
  headline: string;
  subheadline?: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface ServicesSectionContent extends InformationalSectionContent {
  items: Array<{
    name: string;
    description: string;
    descriptor?: string;
  }>;
}

export interface TestimonialsSectionContent {
  headline: string;
  subheadline?: string;
  items: Array<{
    quote: string;
    author: string;
    role?: string;
    isPlaceholder?: boolean;
  }>;
}

export interface FaqSectionContent {
  headline: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
}

export interface CtaSectionContent {
  headline: string;
  supportingLine: string;
  ctaText: string;
  urgencyLabel?: string;
}

export interface ContactSectionContent {
  headline: string;
  subheadline?: string;
  channels: Array<{
    label: string;
    value: string;
  }>;
  helperText?: string;
}

export interface FooterSectionContent {
  shortBlurb: string;
  legalText?: string;
  trustIndicators?: string[];
}

export interface MicrocopyContent {
  primaryButtonLabel?: string;
  secondaryButtonLabel?: string;
  trustIndicator?: string;
  helperText?: string;
  descriptor?: string;
  shortTagline?: string;
  bullets?: string[];
}

export interface GeneratedSectionContentMap {
  hero?: HeroSectionContent;
  about?: InformationalSectionContent;
  services?: ServicesSectionContent;
  features?: InformationalSectionContent;
  process?: InformationalSectionContent;
  benefits?: InformationalSectionContent;
  testimonials?: TestimonialsSectionContent;
  faq?: FaqSectionContent;
  cta?: CtaSectionContent;
  contact?: ContactSectionContent;
  footer?: FooterSectionContent;
  microcopy?: MicrocopyContent;
}

export interface GeneratedPageContent {
  pageSlug: string;
  pageType: PageType;
  messaging: {
    pageHeadline: string;
    pageSubheadline?: string;
    valueProposition: string;
  };
  sections: GeneratedSectionContentMap;
}

export interface WebsiteContentPackage {
  id: string;
  structureId: string;
  userId: string;
  websiteType: WebsiteType;
  tone: TonePreset;
  style: StylePreset;
  lengthPreset: ContentLengthPreset;
  densityPreset: ContentDensityPreset;
  pages: GeneratedPageContent[];
  generatedFromInput: WebsiteGenerationInput;
  generatedAt: string;
  updatedAt: string;
  version: number;
}

export interface ContentGenerationResult {
  content: WebsiteContentPackage;
  mappedStructure: WebsiteStructure;
  validationErrors: string[];
  usedFallback: boolean;
}

export interface WebsiteGeneratedContentRow {
  id: string;
  structure_id: string;
  user_id: string;
  page_slug: string;
  section_key: string;
  content_json: unknown;
  generated_from_input: unknown;
  version: number;
  created_at: string;
  updated_at: string;
}

export type StructurePageSeed = Pick<WebsitePage, "slug" | "type" | "sections">;

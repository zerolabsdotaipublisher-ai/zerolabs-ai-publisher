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
  | "pricing"
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
  audienceOverride?: string;
  conversionGoal?: string;
  sectionVariants?: Partial<Record<ContentSectionType, string>>;
  targetSectionIds?: string[];
}

export interface HeroSectionContent {
  variant?: "text-only" | "with-image";
  eyebrow?: string;
  headline: string;
  subheadline: string;
  supportingCopy: string;
  primaryCta: string;
  secondaryCta?: string;
  ctaHref?: string;
  image?: {
    alt: string;
    src?: string;
    promptHint?: string;
  };
  audience?: string;
  tone?: TonePreset;
  density?: ContentDensityPreset;
  goal?: string;
}

export interface MarketingItemContent {
  title?: string;
  name?: string;
  description: string;
  eyebrow?: string;
  bullets?: string[];
  descriptor?: string;
}

export interface InformationalSectionContent {
  variant?: "grid" | "list" | "stacked";
  headline: string;
  subheadline?: string;
  description?: string;
  paragraphs: string[];
  bullets?: string[];
  items?: MarketingItemContent[];
  audience?: string;
  tone?: TonePreset;
  density?: ContentDensityPreset;
  goal?: string;
}

export interface ServicesSectionContent extends InformationalSectionContent {
  variant?: "grid" | "list";
  items: Array<{
    name: string;
    description: string;
    descriptor?: string;
  }>;
}

export interface TestimonialsSectionContent {
  variant?: "single-quote" | "quote-grid" | "trust-strip";
  headline: string;
  subheadline?: string;
  items: Array<{
    quote: string;
    author: string;
    role?: string;
    company?: string;
    isPlaceholder?: boolean;
  }>;
  audience?: string;
  tone?: TonePreset;
  density?: ContentDensityPreset;
  goal?: string;
}

export interface FaqSectionContent {
  variant?: "compact" | "expanded";
  headline: string;
  subheadline?: string;
  items: Array<{
    question: string;
    answer: string;
  }>;
  audience?: string;
  tone?: TonePreset;
  density?: ContentDensityPreset;
  goal?: string;
}

export interface CtaSectionContent {
  variant?: "banner" | "block";
  headline: string;
  supportingLine: string;
  ctaText: string;
  ctaHref?: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  urgencyLabel?: string;
  audience?: string;
  tone?: TonePreset;
  density?: ContentDensityPreset;
  goal?: string;
}

export interface PricingTierContent {
  name: string;
  price: string;
  billingPeriod?: string;
  description: string;
  features: string[];
  ctaText: string;
  isFeatured?: boolean;
}

export interface PricingSectionContent {
  variant?: "two-tier" | "three-tier";
  headline: string;
  subheadline?: string;
  tiers: PricingTierContent[];
  guaranteeLine?: string;
  disclaimer?: string;
  audience?: string;
  tone?: TonePreset;
  density?: ContentDensityPreset;
  goal?: string;
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
  pricing?: PricingSectionContent;
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
  sections: Partial<GeneratedSectionContentMap>;
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

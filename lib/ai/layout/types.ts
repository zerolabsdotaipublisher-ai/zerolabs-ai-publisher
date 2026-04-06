import type {
  PageType,
  SectionType,
  WebsitePage,
  WebsiteSection,
  WebsiteStructure,
  WebsiteType,
} from "../structure/types";

export type LayoutVariantName =
  | "hero-first"
  | "content-heavy"
  | "minimal"
  | "grid-based"
  | "services-first"
  | "contact-focused";

export type SectionSlot =
  | "hero"
  | "intro"
  | "content-primary"
  | "content-secondary"
  | "social-proof"
  | "conversion"
  | "contact"
  | "footer"
  | "custom";

export type Breakpoint = "desktop" | "tablet" | "mobile";

export type ColumnMode = "single" | "two" | "three";

export type StackBehavior = "preserve" | "stack" | "priority-stack";

export type HeroLayoutMode = "split" | "stacked" | "centered";

export type SpacingScale = "compact" | "comfortable" | "spacious";

export type AlignmentMode = "left" | "center" | "balanced";

export type WidthConstraint = "narrow" | "content" | "wide" | "full";

export type ContainerVariant = "default" | "card" | "plain" | "emphasis";

export type LayoutStyleTag = "editorial" | "modern" | "corporate" | "minimal";

export type EmphasisPattern = "hero-contrast" | "alternating" | "uniform";

export type ColorStrategyHook = "neutral-accent" | "brand-primary" | "high-contrast";

export interface ResponsiveHint {
  columns: ColumnMode;
  stackBehavior: StackBehavior;
  spacingScale: SpacingScale;
  alignmentMode: AlignmentMode;
  heroLayoutMode: HeroLayoutMode;
}

export interface SectionSpacingRule {
  sectionType: SectionType;
  paddingBlock: "xs" | "sm" | "md" | "lg" | "xl";
  marginTop: "none" | "xs" | "sm" | "md";
  marginBottom: "none" | "xs" | "sm" | "md";
}

export interface SectionAlignmentRule {
  sectionType: SectionType;
  alignment: AlignmentMode;
  widthConstraint: WidthConstraint;
  containerVariant: ContainerVariant;
}

export interface LayoutMetadata {
  themeMode: "light" | "dark" | "auto";
  layoutStyleTag: LayoutStyleTag;
  spacingScale: SpacingScale;
  emphasisPattern: EmphasisPattern;
  typographyMood: string;
  colorStrategy: ColorStrategyHook;
}

export interface SectionLayoutNode {
  sectionId: string;
  sectionType: SectionType;
  pageId: string;
  pageSlug: string;
  order: number;
  slot: SectionSlot;
  visible: boolean;
  responsive: Record<Breakpoint, ResponsiveHint>;
  spacing: SectionSpacingRule;
  alignment: SectionAlignmentRule;
  metadata: {
    emphasis?: string;
    layoutHint?: string;
    styleHook?: string;
  };
}

export interface SectionLayoutGroup {
  id: string;
  name: string;
  children: SectionLayoutNode[];
}

export interface PageLayoutModel {
  pageId: string;
  pageSlug: string;
  pageType: PageType;
  templateName: LayoutVariantName;
  hierarchy: Array<SectionLayoutNode | SectionLayoutGroup>;
  sectionLayouts: SectionLayoutNode[];
  responsiveDefaults: Record<Breakpoint, ResponsiveHint>;
  metadata: LayoutMetadata;
}

export interface WebsiteLayoutModel {
  structureId: string;
  websiteType: WebsiteType;
  pages: PageLayoutModel[];
  generatedAt: string;
  version: number;
}

export interface LayoutTemplate {
  name: LayoutVariantName;
  supportedWebsiteTypes: WebsiteType[];
  supportedPageTypes: PageType[];
  defaultSlots: Record<SectionType, SectionSlot>;
  defaultSectionOrder: SectionType[];
  rationale: string;
}

export interface LayoutGenerationContext {
  websiteType: WebsiteType;
  styleTone: string;
  stylePreset: string;
}

export interface LayoutOverrides {
  pageTemplateBySlug?: Record<string, LayoutVariantName>;
  sectionOrderByPageSlug?: Record<string, string[]>;
  sectionVisibilityById?: Record<string, boolean>;
  spacingScaleByPageSlug?: Record<string, SpacingScale>;
  alignmentBySectionId?: Record<string, AlignmentMode>;
}

export interface LayoutGenerationOptions {
  overrides?: LayoutOverrides;
  now?: string;
}

export interface LayoutGenerationResult {
  layout: WebsiteLayoutModel;
  validationErrors: string[];
  usedFallback: boolean;
}

export interface LayoutComposedStructure extends WebsiteStructure {
  layout: WebsiteLayoutModel;
}

export type LayoutPageInput = Pick<WebsitePage, "id" | "slug" | "type" | "sections">;

export type LayoutSectionInput = Pick<
  WebsiteSection,
  "id" | "type" | "order" | "visible" | "styleHints"
>;

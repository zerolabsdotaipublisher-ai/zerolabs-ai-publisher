/**
 * Canonical editor-document contracts for the next editor architecture.
 *
 * These types are intentionally read-only foundation work in Slice 1. They
 * are not used by the current renderer, API routes, or persistence layer.
 */

export const EDITOR_DOCUMENT_SCHEMA_VERSION = 1 as const;

export type EditorDocumentSchemaVersion = typeof EDITOR_DOCUMENT_SCHEMA_VERSION;
export type EditorDocumentId = string;
export type EditorPageId = string;
export type EditorNodeId = string;
export type EditorAssetId = string;
export type EditorSymbolId = string;

/** JSON-compatible values only; executable values are never valid document props. */
export type EditorValue = EditorScalar | EditorValue[] | EditorValueObject;
export type EditorScalar = string | number | boolean | null;
export interface EditorValueObject {
  [key: string]: EditorValue;
}

export type ToneToken = "professional" | "casual" | "premium" | "friendly" | "bold" | "custom";
export type VisualStyleToken =
  | "minimalist"
  | "modern"
  | "corporate"
  | "editorial"
  | "playful"
  | "custom";
export type ThemeModeToken = "light" | "dark" | "auto";
export type SpacingToken = "compact" | "comfortable" | "spacious";
export type AlignmentToken = "left" | "center" | "balanced";
export type WidthToken = "narrow" | "content" | "wide" | "full";
export type ContainerToken = "default" | "card" | "plain" | "emphasis";
export type ColumnToken = 1 | 2 | 3;

export interface SiteStyleTokens {
  tone: ToneToken;
  visualStyle: VisualStyleToken;
  themeMode: ThemeModeToken;
  spacing: SpacingToken;
  colorMood?: string;
  typographyMood?: string;
}

/** Supported presentation tokens. Raw CSS is deliberately not part of this contract. */
export interface NodeStyleTokens {
  alignment?: AlignmentToken;
  width?: WidthToken;
  container?: ContainerToken;
  spacing?: SpacingToken;
  columns?: ColumnToken;
  themeMode?: ThemeModeToken;
}

export interface PageStyleTokens {
  template?: "hero-first" | "content-heavy" | "minimal" | "grid-based" | "services-first" | "contact-focused";
  themeMode?: ThemeModeToken;
  spacing?: SpacingToken;
}

export interface ResponsiveVisibility {
  /** The default visibility used when a breakpoint-specific value is absent. */
  base: boolean;
  desktop?: boolean;
  tablet?: boolean;
  mobile?: boolean;
}

export interface DocumentOpenGraph {
  title: string;
  description: string;
  type: "website" | "article";
  url: string;
  image?: string;
}

export interface DocumentSiteSeo {
  title: string;
  description: string;
  keywords: string[];
  canonicalBaseUrl?: string;
  openGraph?: DocumentOpenGraph;
  /** Safe, JSON-only compatibility fields not yet modeled as first-class props. */
  extensions?: EditorValueObject;
}

export interface DocumentPageSeo {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  openGraph?: DocumentOpenGraph;
  extensions?: EditorValueObject;
}

export interface EditorAssetReference {
  id: EditorAssetId;
  source: "managed" | "external" | "legacy";
  url: string;
  alt?: string;
  metadata?: EditorValueObject;
}

export interface EditorSlot {
  /** Stable slot name supplied by the node type, such as `default` or `actions`. */
  name: string;
  /** Ordered node references. A node may have one parent in the document tree. */
  childIds: EditorNodeId[];
}

export interface LegacyNodeMetadata {
  source: "website-structure";
  sourceId: string;
  sourceType: string;
  unsupported?: boolean;
}

export interface EditorSymbolReference {
  symbolId: EditorSymbolId;
}

export interface EditorNode {
  id: EditorNodeId;
  /** Registry key in later slices, for example `content.heading` or `section.hero`. */
  type: string;
  kind: "section" | "container" | "component" | "global" | "legacy";
  props: EditorValueObject;
  styles?: NodeStyleTokens;
  visibility: ResponsiveVisibility;
  slots: Record<string, EditorSlot>;
  assetIds?: EditorAssetId[];
  symbolReference?: EditorSymbolReference;
  legacy?: LegacyNodeMetadata;
}

export interface PageNavigationIntent {
  label?: string;
  includeInHeader: boolean;
  includeInFooter: boolean;
  includeInSidebar: boolean;
  parentPageId?: EditorPageId | null;
  priority?: number;
}

export interface EditorPage {
  id: EditorPageId;
  name: string;
  path: string;
  order: number;
  visibility: ResponsiveVisibility;
  seo: DocumentPageSeo;
  styles?: PageStyleTokens;
  navigation: PageNavigationIntent;
  /** Page-owned roots. Child ordering lives in each root node's slots. */
  rootNodeIds: EditorNodeId[];
  legacyPageType?: string;
  /** Read-only compatibility payload for layout detail not yet represented by typed tokens. */
  legacyLayout?: EditorValueObject;
}

export type EditorNavigationTarget =
  | { kind: "page"; pageId: EditorPageId }
  | { kind: "node"; nodeId: EditorNodeId; pageId?: EditorPageId }
  | { kind: "external"; url: string }
  /** Explicit compatibility target for legacy links that cannot yet be resolved. */
  | { kind: "unresolved"; originalHref: string };

export interface EditorNavigationItem {
  id: string;
  label: string;
  target: EditorNavigationTarget;
  visible: boolean;
  children: EditorNavigationItem[];
  legacyHref?: string;
}

export interface EditorNavigationMenu {
  id: string;
  location: "header" | "footer" | "sidebar" | "custom";
  label?: string;
  items: EditorNavigationItem[];
}

export interface EditorNavigationModel {
  menus: EditorNavigationMenu[];
  activePageId?: EditorPageId;
  /** Read-only compatibility payload for legacy hierarchy metadata. */
  legacyHierarchy?: EditorValueObject;
}

export interface EditorGlobalComponent {
  id: string;
  role: "header" | "footer";
  nodeId: EditorNodeId;
}

export interface EditorReusableComponent {
  id: EditorSymbolId;
  name: string;
  rootNodeId: EditorNodeId;
}

export interface EditorDocumentSiteSettings {
  name: string;
  tagline?: string;
  seo: DocumentSiteSeo;
  styles: SiteStyleTokens;
}

export interface EditorDocumentCompatibilityMetadata {
  source: "website-structure";
  structureId: string;
  structureVersion: number;
}

export interface EditorDocument {
  id: EditorDocumentId;
  schemaVersion: EditorDocumentSchemaVersion;
  site: EditorDocumentSiteSettings;
  pages: EditorPage[];
  nodes: Record<EditorNodeId, EditorNode>;
  assets: Record<EditorAssetId, EditorAssetReference>;
  navigation: EditorNavigationModel;
  globals: {
    header?: EditorGlobalComponent;
    footer?: EditorGlobalComponent;
    symbols: Record<EditorSymbolId, EditorReusableComponent>;
  };
  compatibility: EditorDocumentCompatibilityMetadata;
}

export interface EditorDocumentValidationError {
  path: string;
  message: string;
  /** Present when the issue can be addressed directly in the node tree. */
  nodeId?: EditorNodeId;
}

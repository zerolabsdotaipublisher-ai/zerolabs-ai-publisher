/**
 * Website structure model for Zero Labs AI Publisher.
 *
 * This module owns the typed, validated, storage-ready website structure
 * produced by the generation pipeline. It is distinct from the AI prompt
 * output contract (lib/ai/prompts/types.ts): the prompt contract is the AI
 * output shape; this model is the product-owned structure persisted and
 * rendered by the app.
 *
 * Relationship to Story 3-1:
 *   WebsiteGenerationOutput (prompt output) → mapper → WebsiteStructure (this)
 */

import type {
  WebsiteGenerationInput,
  TonePreset,
  StylePreset,
  WebsiteType,
} from "../prompts/types";
import type { WebsiteLayoutModel } from "../layout/types";
import type { WebsiteNavigation, PageNavigationFlags } from "../navigation/types";
import type { WebsiteRoutingConfig } from "@/lib/routing";

export type { WebsiteType, TonePreset, StylePreset };

// ---------------------------------------------------------------------------
// Enumerations
// ---------------------------------------------------------------------------

export type WebsiteStructureStatus = "draft" | "published" | "archived";

export type PageType = "home" | "about" | "services" | "contact" | "custom";

export type SectionType =
  | "hero"
  | "about"
  | "services"
  | "testimonials"
  | "cta"
  | "contact"
  | "footer"
  | "custom";

export type ComponentType =
  | "heading"
  | "paragraph"
  | "button"
  | "image"
  | "list"
  | "card"
  | "form"
  | "custom";

// ---------------------------------------------------------------------------
// Component-level (MVP foundation)
// ---------------------------------------------------------------------------

/**
 * A single renderable UI component within a section.
 * Provides a typed foundation for future component-level editing.
 */
export interface WebsiteComponent {
  /** Stable unique identifier. */
  id: string;
  /** Component variant. */
  type: ComponentType;
  /** Arbitrary component props — renderer interprets by type. */
  props: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Section-level
// ---------------------------------------------------------------------------

/**
 * Optional style directives applied to a section during rendering.
 * Derived from the AI styleHints output.
 */
export interface SectionStyleHints {
  /** Emphasis instruction (e.g. "large headline, centered"). */
  emphasis?: string;
  /** Layout hint (e.g. "two-column", "full-width"). */
  layout?: string;
}

/**
 * A single content section within a page.
 * `content` maps directly to the corresponding prompt output section shape.
 */
export interface WebsiteSection {
  /** Stable unique identifier. */
  id: string;
  /** Section variant — drives renderer selection. */
  type: SectionType;
  /** Render order within the page (ascending). */
  order: number;
  /** Whether this section is shown during rendering. */
  visible: boolean;
  /** Section content — field names match the prompt output contract. */
  content: Record<string, unknown>;
  /** Optional UI components generated for this section. */
  components?: WebsiteComponent[];
  /** Optional visual hints passed to the renderer. */
  styleHints?: SectionStyleHints;
}

// ---------------------------------------------------------------------------
// SEO
// ---------------------------------------------------------------------------

/** SEO metadata for an individual page. */
export interface PageSeo {
  /** `<title>` tag value. */
  title: string;
  /** `<meta name="description">` value. */
  description: string;
  /** Keywords array (used for structured data and internal tooling). */
  keywords: string[];
  /** Canonical URL for the page. */
  canonicalUrl?: string;
  /** Open Graph metadata for social sharing previews. */
  openGraph?: {
    title: string;
    description: string;
    type: "website" | "article";
    url: string;
    image?: string;
  };
}

// ---------------------------------------------------------------------------
// Page-level
// ---------------------------------------------------------------------------

/**
 * A single page within the website structure.
 * MVP generates one home page; multi-page support is ready via this model.
 */
export interface WebsitePage {
  /** Stable unique identifier. */
  id: string;
  /** URL path (e.g. "/" for home, "/about" for about). */
  slug: string;
  /** Human-readable page title. */
  title: string;
  /** Page variant. */
  type: PageType;
  /** Ordered sections on this page. */
  sections: WebsiteSection[];
  /** Page-level SEO metadata. */
  seo: PageSeo;
  /** Render order for multi-page navigation (ascending). */
  order: number;
  /** Parent page id for hierarchical navigation. */
  parentPageId?: string | null;
  /** Hierarchy depth (root = 0). */
  depth?: number;
  /** Navigation + conversion priority (lower appears earlier). */
  priority?: number;
  /** Page visibility in generated output. */
  visible?: boolean;
  /** Navigation inclusion flags by menu location. */
  navigation?: PageNavigationFlags;
  /** Optional generated navigation label override. */
  navigationLabel?: string;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Site-level SEO
// ---------------------------------------------------------------------------

/** Site-wide SEO metadata. */
export interface WebsiteSeo {
  /** Default `<title>` for the site. */
  title: string;
  /** Default meta description. */
  description: string;
  /** Primary keywords for the site. */
  keywords: string[];
  /** Canonical base URL for generated pages. */
  canonicalBaseUrl?: string;
  /** Open Graph image URL (optional). */
  ogImage?: string;
  /** Default Open Graph metadata for the site. */
  openGraph?: {
    title: string;
    description: string;
    type: "website" | "article";
    url: string;
    image?: string;
  };
}

// ---------------------------------------------------------------------------
// Style configuration
// ---------------------------------------------------------------------------

/** Visual style directives derived from AI output. */
export interface WebsiteStyleConfig {
  tone: TonePreset;
  style: StylePreset;
  /** Colour mood description (e.g. "Clean neutrals with one accent"). */
  colorMood: string;
  /** Typography mood description (e.g. "Readable sans-serif hierarchy"). */
  typographyMood: string;
}

// ---------------------------------------------------------------------------
// Dynamic content variations
// ---------------------------------------------------------------------------

/**
 * A set of content variants for a specific field in a section.
 * Supports A/B testing and iterative regeneration without full re-generation.
 */
export interface ContentVariation {
  /** ID of the section that owns this variation. */
  sectionId: string;
  /** Dot-notation path to the field (e.g. "content.headline"). */
  fieldPath: string;
  /** All available variants for this field. */
  variants: string[];
  /** Index of the currently active variant. */
  activeVariant: number;
}

// ---------------------------------------------------------------------------
// Full website structure model
// ---------------------------------------------------------------------------

/**
 * The complete, validated, storage-ready website structure.
 *
 * This is the product-owned model that represents a generated website.
 * It is produced by the generation pipeline, persisted in Supabase, and
 * consumed by the frontend renderer.
 */
export interface WebsiteStructure {
  /** Stable unique identifier (e.g. "ws_<timestamp>_<random>"). */
  id: string;
  /** Owning user ID — maps to auth.users.id. */
  userId: string;
  /** Website type from the source input. */
  websiteType: WebsiteType;
  /** Site display name. */
  siteTitle: string;
  /** One-line brand tagline. */
  tagline: string;
  /** Ordered list of pages. One page for MVP; multi-page ready. */
  pages: WebsitePage[];
  /** Site-wide navigation structure. */
  navigation: WebsiteNavigation;
  /** Site-level SEO metadata. */
  seo: WebsiteSeo;
  /** Visual style configuration. */
  styleConfig: WebsiteStyleConfig;
  /** Optional content variations for A/B testing. */
  contentVariations?: ContentVariation[];
  /** Generated page layout model layered on top of structure. */
  layout?: WebsiteLayoutModel;
  /** Publication lifecycle metadata owned by the product app. */
  publication?: {
    state: "draft" | "publishing" | "published" | "update_pending" | "update_failed" | "unpublished";
    publishedVersion?: number;
    liveUrl?: string;
    livePath?: string;
    deployment?: {
      deploymentId?: string;
      providerDeploymentId?: string;
      target?: string;
      environment: "preview" | "production";
      status:
        | "queued"
        | "validating"
        | "building"
        | "deploying"
        | "updating"
        | "deployed"
        | "ready"
        | "failed";
      url?: string;
      path?: string;
      domains?: string[];
      attempts?: number;
      updatedAt: string;
      lastError?: string;
      providerMetadata?: Record<string, unknown>;
      logs?: Array<{
        at: string;
        level: "info" | "warn" | "error";
        message: string;
        details?: Record<string, unknown>;
      }>;
    };
    firstPublishedAt?: string;
    lastPublishedAt?: string;
    lastDraftUpdatedAt?: string;
    lastPublishAttemptAt?: string;
    lastUpdatedAt?: string;
    lastError?: string;
    updates?: {
      liveVersionId?: string;
      liveFingerprint?: {
        generatedAt: string;
        site: Record<"content" | "structure" | "layout" | "seo" | "routing", string>;
        pages: Array<{
          pageId: string;
          path: string;
          assetPaths: string[];
          signatures: Record<"content" | "structure" | "layout" | "seo" | "routing", string>;
        }>;
        routePaths: string[];
        assetPaths: string[];
      };
      pending?: {
        required: boolean;
        triggeredBy: Array<"content" | "structure" | "layout" | "seo" | "routing" | "manual">;
        scope: {
          fullSite: boolean;
          metadataOnly: boolean;
          pageIds: string[];
          routePaths: string[];
          assetPaths: string[];
          changeKinds: Array<"content" | "structure" | "layout" | "seo" | "routing">;
        };
        summary: string;
        comparedAt: string;
        fingerprint: {
          generatedAt: string;
          site: Record<"content" | "structure" | "layout" | "seo" | "routing", string>;
          pages: Array<{
            pageId: string;
            path: string;
            assetPaths: string[];
            signatures: Record<"content" | "structure" | "layout" | "seo" | "routing", string>;
          }>;
          routePaths: string[];
          assetPaths: string[];
        };
      };
      queue?: {
        activeRequestId?: string;
        requestedAt?: string;
        startedAt?: string;
        completedAt?: string;
        lastCompletedRequestId?: string;
        duplicateRequests: number;
      };
      current?: {
        requestId: string;
        action: "publish" | "update";
        status: "pending" | "running" | "succeeded" | "failed" | "noop";
        requestedAt: string;
        startedAt?: string;
        completedAt?: string;
        error?: string;
        retryable?: boolean;
        update?: {
          required: boolean;
          triggeredBy: Array<"content" | "structure" | "layout" | "seo" | "routing" | "manual">;
          scope: {
            fullSite: boolean;
            metadataOnly: boolean;
            pageIds: string[];
            routePaths: string[];
            assetPaths: string[];
            changeKinds: Array<"content" | "structure" | "layout" | "seo" | "routing">;
          };
          summary: string;
          comparedAt: string;
          fingerprint: {
            generatedAt: string;
            site: Record<"content" | "structure" | "layout" | "seo" | "routing", string>;
            pages: Array<{
              pageId: string;
              path: string;
              assetPaths: string[];
              signatures: Record<"content" | "structure" | "layout" | "seo" | "routing", string>;
            }>;
            routePaths: string[];
            assetPaths: string[];
          };
        };
      };
      retry?: {
        retryable: boolean;
        retryCount: number;
        recommendedAction: "retry" | "fix_and_retry" | "manual_review";
        lastAttemptAt?: string;
      };
      rollback?: {
        providerSupport: "metadata-only" | "manual" | "native";
        rollbackReady: boolean;
        currentVersionId?: string;
        previousStableVersionId?: string;
      };
      cache?: {
        strategy: "full-site-redeploy" | "targeted-path-refresh";
        provider: "provider-neutral" | "vercel";
        affectedPaths: string[];
        assetPaths: string[];
        notes: string;
        invalidatedAt?: string;
      };
      domain?: {
        liveUrl: string;
        livePath: string;
        domains: string[];
        providerDeploymentUrl?: string;
        preservedLivePath: boolean;
        preservedDomains: boolean;
      };
      staticSite?: {
        pageCount: number;
        routeCount: number;
        assetCount: number;
        routePaths: string[];
        assetPaths: string[];
      };
      history?: Array<{
        versionId: string;
        structureVersion: number;
        publishedAt: string;
        deploymentId?: string;
        providerDeploymentId?: string;
        status:
          | "queued"
          | "validating"
          | "building"
          | "deploying"
          | "updating"
          | "deployed"
          | "ready"
          | "failed";
        live: boolean;
        liveUrl: string;
        livePath: string;
        domains: string[];
        update: {
          required: boolean;
          triggeredBy: Array<"content" | "structure" | "layout" | "seo" | "routing" | "manual">;
          scope: {
            fullSite: boolean;
            metadataOnly: boolean;
            pageIds: string[];
            routePaths: string[];
            assetPaths: string[];
            changeKinds: Array<"content" | "structure" | "layout" | "seo" | "routing">;
          };
          summary: string;
          comparedAt: string;
          fingerprint: {
            generatedAt: string;
            site: Record<"content" | "structure" | "layout" | "seo" | "routing", string>;
            pages: Array<{
              pageId: string;
              path: string;
              assetPaths: string[];
              signatures: Record<"content" | "structure" | "layout" | "seo" | "routing", string>;
            }>;
            routePaths: string[];
            assetPaths: string[];
          };
        };
        cache: {
          strategy: "full-site-redeploy" | "targeted-path-refresh";
          provider: "provider-neutral" | "vercel";
          affectedPaths: string[];
          assetPaths: string[];
          notes: string;
          invalidatedAt?: string;
        };
        domain: {
          liveUrl: string;
          livePath: string;
          domains: string[];
          providerDeploymentUrl?: string;
          preservedLivePath: boolean;
          preservedDomains: boolean;
        };
        staticSite: {
          pageCount: number;
          routeCount: number;
          assetCount: number;
          routePaths: string[];
          assetPaths: string[];
        };
        rollback: {
          providerSupport: "metadata-only" | "manual" | "native";
          rollbackReady: boolean;
          currentVersionId?: string;
          previousStableVersionId?: string;
        };
        logs?: Array<{
          at: string;
          level: "info" | "warn" | "error";
          message: string;
          details?: Record<string, unknown>;
        }>;
      }>;
      logs?: Array<{
        at: string;
        phase: "analysis" | "queue" | "deployment" | "cache" | "domain" | "completion" | "retry";
        level: "info" | "warn" | "error";
        message: string;
        requestId?: string;
        details?: Record<string, unknown>;
      }>;
    };
  };
  /** Product-owned management metadata for dashboard/listing and deletion workflows. */
  management?: {
    displayName?: string;
    description?: string;
    deletedAt?: string;
    deletedBy?: string;
    deletionState?: "active" | "deleting" | "deleted";
  };
  /** Product-owned website route model for preview/live/frontend resolution. */
  routing?: WebsiteRoutingConfig;
  /** Original input that produced this structure. */
  sourceInput: WebsiteGenerationInput;
  /** Lifecycle status. */
  status: WebsiteStructureStatus;
  /** Incremented on each regeneration. */
  version: number;
  /** ISO 8601 timestamp of first generation. */
  generatedAt: string;
  /** ISO 8601 timestamp of last update. */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Generation result
// ---------------------------------------------------------------------------

/** Result returned by the generation service. */
export interface StructureGenerationResult {
  /** The produced website structure. */
  structure: WebsiteStructure;
  /** Validation errors found after generation (structure may still be usable). */
  validationErrors: string[];
  /** True when at least one AI output field was replaced by a fallback value. */
  usedFallback: boolean;
}

// ---------------------------------------------------------------------------
// Storage row (Supabase public.website_structures)
// ---------------------------------------------------------------------------

/**
 * Database row shape for public.website_structures.
 * `structure` and `source_input` are stored as JSONB.
 */
export interface WebsiteStructureRow {
  id: string;
  user_id: string;
  website_type: string;
  site_title: string;
  tagline: string;
  /** Full structure stored as JSONB. */
  structure: unknown;
  /** Original generation input stored as JSONB. */
  source_input: unknown;
  status: string;
  version: number;
  generated_at: string;
  updated_at: string;
}

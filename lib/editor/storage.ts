import "server-only";

import { config } from "@/config";
import { storeWebsiteNavigation } from "@/lib/ai/navigation";
import { storeWebsiteSeoMetadata } from "@/lib/ai/seo";
import type { WebsiteSeoPackage } from "@/lib/ai/seo";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure";
import type { WebsitePage, WebsiteStructure } from "@/lib/ai/structure";
import { logger } from "@/lib/observability";
import { markDraftUpdatedForPublication } from "@/lib/publish";
import { applySystemManagedBoundaries } from "./boundaries";
import type { EditorValidationError } from "./types";
import { validateEditorDraft } from "./validation";

function buildCanonicalUrl(baseUrl: string, slug: string): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  if (slug === "/") {
    return new URL("/", normalizedBase).toString();
  }

  const normalizedSlug = slug.startsWith("/") ? slug.slice(1) : slug;
  return new URL(normalizedSlug, normalizedBase).toString();
}

function mapPageSeo(page: WebsitePage, canonicalBaseUrl: string) {
  const canonicalUrl = page.seo.canonicalUrl || buildCanonicalUrl(canonicalBaseUrl, page.slug);

  return {
    pageSlug: page.slug,
    pageType: page.type,
    title: page.seo.title,
    description: page.seo.description,
    keywords: page.seo.keywords,
    canonicalUrl,
    openGraph: page.seo.openGraph ?? {
      title: page.seo.title,
      description: page.seo.description,
      type: "website",
      url: canonicalUrl,
      image: undefined,
    },
  };
}

function toSeoPackage(structure: WebsiteStructure): WebsiteSeoPackage {
  const canonicalBaseUrl = structure.seo.canonicalBaseUrl || config.app.url;

  return {
    id: `wseo_${structure.id}_v${structure.version}`,
    structureId: structure.id,
    userId: structure.userId,
    websiteType: structure.websiteType,
    site: {
      title: structure.seo.title,
      description: structure.seo.description,
      keywords: structure.seo.keywords,
      canonicalBaseUrl,
      defaultOpenGraph: structure.seo.openGraph ?? {
        title: structure.seo.title,
        description: structure.seo.description,
        type: "website",
        url: canonicalBaseUrl,
        image: structure.seo.ogImage,
      },
    },
    pages: structure.pages.map((page) => mapPageSeo(page, canonicalBaseUrl)),
    generatedFromInput: structure.sourceInput,
    generatedAt: structure.generatedAt,
    updatedAt: structure.updatedAt,
    version: structure.version,
  };
}

export async function loadEditorStructure(structureId: string, userId: string): Promise<WebsiteStructure | null> {
  return getWebsiteStructure(structureId, userId);
}

export interface SaveEditorStructureResult {
  structure?: WebsiteStructure;
  validationErrors: EditorValidationError[];
  error?: string;
}

export async function saveEditorStructureDraft(userId: string, structure: WebsiteStructure): Promise<SaveEditorStructureResult> {
  const existing = await getWebsiteStructure(structure.id, userId);
  if (!existing) {
    return {
      validationErrors: [],
      error: "Website structure not found.",
    };
  }

  const now = new Date().toISOString();
  const draft = applySystemManagedBoundaries(existing, structure);
  const withAuditFieldsBase: WebsiteStructure = {
    ...draft,
    version: existing.version + 1,
    updatedAt: now,
    status: existing.status,
  };
  const withAuditFields = markDraftUpdatedForPublication(withAuditFieldsBase, now);

  const validationErrors = validateEditorDraft(withAuditFields);
  if (validationErrors.length > 0) {
    return {
      validationErrors,
      error: "Validation failed for draft edits.",
    };
  }

  try {
    const updated = await updateWebsiteStructure(withAuditFields);

    await storeWebsiteNavigation({
      structureId: updated.id,
      userId,
      navigation: updated.navigation,
      version: updated.version,
      createdAt: updated.generatedAt,
      updatedAt: updated.updatedAt,
    });

    await storeWebsiteSeoMetadata(toSeoPackage(updated));

    return {
      structure: updated,
      validationErrors: [],
    };
  } catch (error) {
    logger.error("Failed to save editor draft", {
      category: "error",
      service: "editor",
      userId,
      structureId: structure.id,
      error: {
        name: "EditorSaveDraftError",
        message: error instanceof Error ? error.message : "Unknown error",
      },
    });

    return {
      validationErrors: [],
      error: "Failed to save draft changes.",
    };
  }
}

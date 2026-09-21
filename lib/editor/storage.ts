import "server-only";

import { config } from "@/config";
import { storeWebsiteNavigation } from "@/lib/ai/navigation";
import { generateNavigation } from "@/lib/ai/structure/navigation";
import { storeWebsiteSeoMetadata } from "@/lib/ai/seo";
import type { WebsiteSeoPackage } from "@/lib/ai/seo";
import { getWebsiteStructure, updateWebsiteStructure } from "@/lib/ai/structure";
import type { WebsitePage, WebsiteStructure } from "@/lib/ai/structure";
import { logger } from "@/lib/observability";
import { markDraftUpdatedForPublication } from "@/lib/publish";
import { withRegeneratedWebsiteRouting } from "@/lib/routing";
import { createWebsiteVersionLabel } from "@/lib/versions/model";
import { createWebsiteVersion } from "@/lib/versions/storage";
import { applySystemManagedBoundaries } from "./boundaries";
import type { EditorValidationError } from "./types";
import { validateEditorDraft } from "./validation";

type EditorDraftPersistenceStage = "structure" | "navigation" | "seo";

interface EditorPersistenceErrorDetails {
  code?: string;
  message: string;
}

function getEditorPersistenceErrorDetails(error: unknown): EditorPersistenceErrorDetails {
  const candidate = error as { code?: unknown; message?: unknown } | null;
  const code = typeof candidate?.code === "string" ? candidate.code : undefined;
  const message =
    error instanceof Error
      ? error.message
      : typeof candidate?.message === "string"
        ? candidate.message
        : "Unknown persistence error";

  return { code, message };
}

function developmentDiagnostic(stage: EditorDraftPersistenceStage, error: unknown): string | undefined {
  if (config.app.environment !== "development") {
    return undefined;
  }

  const details = getEditorPersistenceErrorDetails(error);
  const code = details.code ? ` (${details.code})` : "";
  return `Draft save failed during ${stage} persistence${code}: ${details.message}`;
}

/**
 * Stored structures created before navigation hierarchy support can still have
 * valid primary/footer navigation but no hierarchy or menus. The navigation
 * read model requires both JSON columns, so derive only that storage payload
 * from the current canonical pages without modifying the editor draft.
 */
function getNavigationForArtifactPersistence(structure: WebsiteStructure): WebsiteStructure["navigation"] {
  const navigation = structure.navigation;
  if (navigation.hierarchy && navigation.menus?.length) {
    return navigation;
  }

  const generated = generateNavigation(structure.websiteType, structure.pages, structure.siteTitle);
  return {
    ...generated,
    primary: navigation.primary.length ? navigation.primary : generated.primary,
    footer: navigation.footer?.length ? navigation.footer : generated.footer,
    activePath: navigation.activePath ?? generated.activePath,
  };
}

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

export async function persistWebsiteStructureArtifacts(
  structure: WebsiteStructure,
  userId: string,
  onStage?: (stage: Exclude<EditorDraftPersistenceStage, "structure">) => void,
): Promise<void> {
  onStage?.("navigation");
  await storeWebsiteNavigation({
    structureId: structure.id,
    userId,
    navigation: getNavigationForArtifactPersistence(structure),
    version: structure.version,
    createdAt: structure.generatedAt,
    updatedAt: structure.updatedAt,
  });

  onStage?.("seo");
  await storeWebsiteSeoMetadata(toSeoPackage(structure));
}

export async function loadEditorStructure(structureId: string, userId: string): Promise<WebsiteStructure | null> {
  const structure = await getWebsiteStructure(structureId, userId);
  if (!structure || structure.management?.deletedAt) {
    return null;
  }

  return structure;
}

export interface SaveEditorStructureResult {
  structure?: WebsiteStructure;
  validationErrors: EditorValidationError[];
  error?: string;
  versionId?: string;
  failureStage?: EditorDraftPersistenceStage;
  diagnostic?: string;
}

export async function saveEditorStructureDraft(userId: string, structure: WebsiteStructure): Promise<SaveEditorStructureResult> {
  const existing = await getWebsiteStructure(structure.id, userId);
  if (!existing || existing.management?.deletedAt) {
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
  // Publication metadata is recomputed after version/timestamp updates so we can
  // detect saved-but-unpublished draft changes for publish controls.
  const withAuditFields = markDraftUpdatedForPublication(withAuditFieldsBase, now);

  const routed = withRegeneratedWebsiteRouting(withAuditFields, now);
  const validationErrors = [
    ...validateEditorDraft(routed.structure),
    ...routed.validationErrors.map((message) => ({
      field: "routing",
      message,
    })),
  ];
  if (validationErrors.length > 0) {
    return {
      validationErrors,
      error: "Validation failed for draft edits.",
    };
  }

  let failureStage: EditorDraftPersistenceStage = "structure";

  try {
    const updated = await updateWebsiteStructure(routed.structure);
    await persistWebsiteStructureArtifacts(updated, userId, (stage) => {
      failureStage = stage;
    });
    let versionId: string | undefined;

    try {
      const versionRecord = await createWebsiteVersion({
        structure: updated,
        userId,
        source: "draft_save",
        status: "draft",
        label: createWebsiteVersionLabel("draft_save", updated),
      });
      versionId = versionRecord.id;
    } catch (error) {
      logger.error("Failed to store draft version snapshot", {
        category: "error",
        service: "versions",
        userId,
        structureId: updated.id,
        error: {
          name: "EditorDraftVersionError",
          message: error instanceof Error ? error.message : "Unknown error",
        },
      });
    }

    return {
      structure: updated,
      validationErrors: [],
      versionId,
    };
  } catch (error) {
    const details = getEditorPersistenceErrorDetails(error);
    logger.error("Failed to save editor draft", {
      category: "error",
      service: "editor",
      userId,
      structureId: structure.id,
      failureStage,
      failureCode: details.code,
      error: {
        name: "EditorSaveDraftError",
        message: details.message,
      },
    });

    return {
      validationErrors: [],
      error: "Failed to save draft changes.",
      failureStage,
      diagnostic: developmentDiagnostic(failureStage, error),
    };
  }
}

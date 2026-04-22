import type { WebsiteStructure } from "@/lib/ai/structure";
import { validateWebsiteStructure } from "@/lib/ai/structure";
import { buildPublicationFingerprint, type PublicationStructureFingerprint } from "@/lib/publish";
import type {
  WebsiteVersionArticleSummary,
  WebsiteVersionBlogSummary,
  WebsiteVersionSnapshot,
  WebsiteVersionSummary,
} from "./types";

export interface WebsiteVersionSnapshotBundle {
  snapshot: WebsiteVersionSnapshot;
  fingerprint: PublicationStructureFingerprint;
  summary: WebsiteVersionSummary;
}

function cloneStructure(structure: WebsiteStructure): WebsiteStructure {
  return structuredClone(structure);
}

function extractBlogSummary(structure: WebsiteStructure): WebsiteVersionBlogSummary | undefined {
  if (structure.websiteType !== "blog") {
    return undefined;
  }

  const articlePage = structure.pages.find((page) =>
    page.sections.some(
      (section) =>
        section.type === "custom" &&
        (section.content as { kind?: string }).kind === "blog-post-body",
    ),
  );

  if (!articlePage) {
    return undefined;
  }

  const bodySection = articlePage.sections.find(
    (section) =>
      section.type === "custom" &&
      (section.content as { kind?: string }).kind === "blog-post-body",
  );
  const headerSection = articlePage.sections.find(
    (section) =>
      section.type === "custom" &&
      (section.content as { kind?: string }).kind === "blog-post-header",
  );
  const sections =
    ((bodySection?.content as { sections?: Array<{ paragraphs?: string[] }> } | undefined)?.sections ??
      []).filter(Boolean);
  return {
    postSlug: articlePage.slug,
    sectionCount: sections.length,
    wordCount: sections
      .flatMap((section) => section.paragraphs ?? [])
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length,
    qualityStatus:
      (headerSection?.content as { qualityStatus?: string } | undefined)?.qualityStatus,
  };
}

function extractArticleSummary(structure: WebsiteStructure): WebsiteVersionArticleSummary | undefined {
  if (structure.websiteType !== "article") {
    return undefined;
  }

  const articlePage = structure.pages.find((page) =>
    page.sections.some(
      (section) =>
        section.type === "custom" &&
        (section.content as { kind?: string }).kind === "article-page-body",
    ),
  );

  if (!articlePage) {
    return undefined;
  }

  const bodySection = articlePage.sections.find(
    (section) =>
      section.type === "custom" &&
      (section.content as { kind?: string }).kind === "article-page-body",
  );
  const headerSection = articlePage.sections.find(
    (section) =>
      section.type === "custom" &&
      (section.content as { kind?: string }).kind === "article-page-header",
  );
  const referencesSection = articlePage.sections.find(
    (section) =>
      section.type === "custom" &&
      (section.content as { kind?: string }).kind === "article-page-references",
  );
  const sections =
    ((bodySection?.content as { sections?: Array<{ paragraphs?: string[] }> } | undefined)?.sections ??
      []).filter(Boolean);
  const references =
    ((referencesSection?.content as { references?: unknown[] } | undefined)?.references ?? []).filter(Boolean);

  return {
    articleSlug: articlePage.slug,
    articleType:
      (headerSection?.content as { articleType?: string } | undefined)?.articleType,
    sectionCount: sections.length,
    wordCount: sections
      .flatMap((section) => section.paragraphs ?? [])
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length,
    referenceCount: references.length,
    qualityStatus:
      (headerSection?.content as { qualityStatus?: string } | undefined)?.qualityStatus,
  };
}

export function createWebsiteVersionSnapshot(structure: WebsiteStructure): WebsiteVersionSnapshotBundle {
  const validationErrors = validateWebsiteStructure(structure);
  if (validationErrors.length > 0) {
    throw new Error(`Version snapshot is invalid: ${validationErrors.join("; ")}`);
  }

  const structureClone = cloneStructure(structure);
  const fingerprint = buildPublicationFingerprint(structureClone);
  const blog = extractBlogSummary(structureClone);
  const article = extractArticleSummary(structureClone);

  return {
    snapshot: {
      schemaVersion: 1,
      capturedAt: structureClone.updatedAt,
      structure: structureClone,
      blog,
      article,
    },
    fingerprint,
    summary: {
      pageCount: structureClone.pages.length,
      routeCount: fingerprint.routePaths.length,
      assetCount: fingerprint.assetPaths.length,
      pageIds: structureClone.pages.map((page) => page.id),
      routePaths: fingerprint.routePaths,
      assetPaths: fingerprint.assetPaths,
      blog,
      article,
    },
  };
}

export function assertWebsiteVersionSnapshot(snapshot: WebsiteVersionSnapshot): WebsiteStructure {
  if (snapshot.schemaVersion !== 1) {
    throw new Error(`Unsupported website version snapshot schema: ${snapshot.schemaVersion}`);
  }

  const validationErrors = validateWebsiteStructure(snapshot.structure);
  if (validationErrors.length > 0) {
    throw new Error(`Stored website version snapshot is invalid: ${validationErrors.join("; ")}`);
  }

  return snapshot.structure;
}

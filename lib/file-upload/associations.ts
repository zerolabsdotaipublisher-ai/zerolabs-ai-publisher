import type { FileUploadAssociationInput, FileUploadAssociationType, FileUploadSource } from "./types";

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function dedupeAssociations(values: FileUploadAssociationInput[]): FileUploadAssociationInput[] {
  const seen = new Set<string>();
  return values.filter((entry) => {
    const key = [entry.associationType, entry.associationId, entry.contentId ?? "", entry.contentType ?? ""].join(":");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildFileUploadAssociations(input: {
  source: FileUploadSource;
  linkedContentId?: string;
  linkedContentType?: string;
  websiteId?: string;
  pageId?: string;
  sectionId?: string;
  metadata?: Record<string, unknown>;
}): FileUploadAssociationInput[] {
  const associations: FileUploadAssociationInput[] = [];
  const metadata = toRecord(input.metadata);

  if (input.linkedContentId) {
    associations.push({
      associationType: input.source === "social_publishing" ? "social_post" : "content_record",
      associationId: input.linkedContentId,
      contentId: input.linkedContentId,
      contentType: input.linkedContentType,
      metadata,
    });
  }

  if (input.websiteId) {
    associations.push({
      associationType: "website",
      associationId: input.websiteId,
      contentId: input.linkedContentId,
      contentType: input.linkedContentType,
      metadata,
    });
    associations.push({
      associationType: "website_media_library",
      associationId: input.websiteId,
      contentId: input.linkedContentId,
      contentType: input.linkedContentType,
      metadata: { ...metadata, source: "website-media-library" },
    });
  }

  if (input.pageId) {
    associations.push({
      associationType: "page",
      associationId: input.pageId,
      contentId: input.linkedContentId,
      contentType: input.linkedContentType,
      metadata,
    });
  }

  if (input.sectionId) {
    associations.push({
      associationType: "section",
      associationId: input.sectionId,
      contentId: input.linkedContentId,
      contentType: input.linkedContentType,
      metadata,
    });
  }

  if (input.source === "media_library") {
    associations.push({
      associationType: "media_library",
      associationId: input.linkedContentId ?? "library",
      contentId: input.linkedContentId,
      contentType: input.linkedContentType,
      metadata,
    });
  }

  return dedupeAssociations(associations);
}

export function normalizeFileUploadAssociations(
  associations: FileUploadAssociationInput[] | undefined,
): FileUploadAssociationInput[] {
  if (!associations?.length) return [];
  return dedupeAssociations(
    associations
      .filter((entry) => Boolean(entry?.associationType && entry?.associationId))
      .map((entry) => ({
        associationType: entry.associationType,
        associationId: entry.associationId.trim(),
        contentId: entry.contentId?.trim(),
        contentType: entry.contentType?.trim(),
        metadata: toRecord(entry.metadata),
      }))
      .filter((entry) => entry.associationId.length > 0),
  );
}

export function buildFileUploadAssociationSummary(input: {
  source: FileUploadSource;
  linkedContentId?: string;
  linkedContentType?: string;
  associations: FileUploadAssociationInput[];
}): Record<string, unknown> {
  const byType = input.associations.reduce<Record<FileUploadAssociationType, number>>((acc, entry) => {
    acc[entry.associationType] = (acc[entry.associationType] ?? 0) + 1;
    return acc;
  }, {} as Record<FileUploadAssociationType, number>);

  return {
    source: input.source,
    linkedContentId: input.linkedContentId,
    linkedContentType: input.linkedContentType,
    totalAssociations: input.associations.length,
    byType,
  };
}

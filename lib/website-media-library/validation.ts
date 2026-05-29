import { validateMediaUploadInput } from "@/lib/media/validation";
import type { WebsiteMediaLibraryTagUpdateInput, WebsiteMediaLibraryUploadInput, WebsiteMediaLibraryUsageInput } from "./types";
import { normalizeWebsiteMediaTags } from "./tags";

const TEXT_LIMIT = 240;
const LONG_TEXT_LIMIT = 1200;
const CONTENT_REFERENCE_ID_PATTERN = /^[a-z0-9_:-]+$/i;

function trimOptional(value: string | undefined, limit: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, limit);
}

function validateContentReference(value: string | undefined, field: string, errors: string[]): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (!CONTENT_REFERENCE_ID_PATTERN.test(trimmed)) {
    errors.push(`${field} contains unsupported characters.`);
    return undefined;
  }
  return trimmed;
}

export function validateWebsiteMediaLibraryUploadInput(input: WebsiteMediaLibraryUploadInput) {
  const uploadValidation = validateMediaUploadInput({
    userId: input.userId,
    tenantId: input.tenantId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    bytes: input.bytes,
  });
  const errors = [...uploadValidation.errors];

  const websiteId = validateContentReference(input.websiteId, "websiteId", errors);
  const linkedContentId = validateContentReference(input.linkedContentId, "linkedContentId", errors);
  const linkedContentType = trimOptional(input.linkedContentType, 80);
  const pageId = validateContentReference(input.pageId, "pageId", errors);
  const sectionId = validateContentReference(input.sectionId, "sectionId", errors);
  const title = trimOptional(input.title, TEXT_LIMIT);
  const description = trimOptional(input.description, LONG_TEXT_LIMIT);
  const altText = trimOptional(input.altText, TEXT_LIMIT);
  const tags = normalizeWebsiteMediaTags(input.tags);

  if (linkedContentId && !linkedContentType) {
    errors.push("linkedContentType is required when linkedContentId is provided.");
  }

  return {
    ok: errors.length === 0,
    errors,
    normalized: {
      ...uploadValidation.normalized,
      websiteId,
      linkedContentId,
      linkedContentType,
      pageId,
      sectionId,
      title,
      description,
      altText,
      tags,
    },
  };
}

export function validateWebsiteMediaTagUpdateInput(input: WebsiteMediaLibraryTagUpdateInput) {
  const errors: string[] = [];
  const websiteId = validateContentReference(input.websiteId, "websiteId", errors);
  const displayName = trimOptional(input.displayName, TEXT_LIMIT);
  const description = trimOptional(input.description, LONG_TEXT_LIMIT);
  const altText = trimOptional(input.altText, TEXT_LIMIT);
  const tags = normalizeWebsiteMediaTags(input.tags);

  return {
    ok: errors.length === 0,
    errors,
    normalized: {
      websiteId,
      displayName,
      description,
      altText,
      tags,
    },
  };
}

export function validateWebsiteMediaUsageInput(input: WebsiteMediaLibraryUsageInput) {
  const errors: string[] = [];
  const websiteId = validateContentReference(input.websiteId, "websiteId", errors);
  const contentId = validateContentReference(input.contentId, "contentId", errors);
  const contentType = trimOptional(input.contentType, 80);
  const pageId = validateContentReference(input.pageId, "pageId", errors);
  const sectionId = validateContentReference(input.sectionId, "sectionId", errors);

  if (contentId && !contentType) {
    errors.push("contentType is required when contentId is provided.");
  }

  return {
    ok: errors.length === 0,
    errors,
    normalized: {
      websiteId,
      contentId,
      contentType,
      pageId,
      sectionId,
    },
  };
}

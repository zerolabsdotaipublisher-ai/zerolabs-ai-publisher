import { validateMediaUploadInput } from "@/lib/media/validation";
import { parseUsageContext } from "@/lib/media/schema";
import { inferUsageContextFromSource } from "./model";
import { normalizeFileUploadAssociations } from "./associations";
import type { FileUploadAssociationInput, FileUploadInput, FileUploadSource } from "./types";

const CONTENT_REFERENCE_ID_PATTERN = /^[a-z0-9_:-]+$/i;
const ERROR_CODE_PATTERN = /^[a-z0-9_.:-]+$/i;

function trimOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeMetadata(value: Record<string, unknown> | undefined): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function validateReference(value: string | undefined, field: string, errors: string[]): string | undefined {
  const trimmed = trimOptional(value);
  if (!trimmed) return undefined;
  if (!CONTENT_REFERENCE_ID_PATTERN.test(trimmed)) {
    errors.push(`${field} contains unsupported characters.`);
    return undefined;
  }
  return trimmed;
}

function validateAssociations(value: FileUploadAssociationInput[] | undefined, errors: string[]) {
  const associations = normalizeFileUploadAssociations(value);
  associations.forEach((entry) => {
    if (!CONTENT_REFERENCE_ID_PATTERN.test(entry.associationId)) {
      errors.push(`associationId for ${entry.associationType} contains unsupported characters.`);
    }
    if (entry.contentId && !CONTENT_REFERENCE_ID_PATTERN.test(entry.contentId)) {
      errors.push(`contentId for ${entry.associationType} contains unsupported characters.`);
    }
    if (entry.contentType && !ERROR_CODE_PATTERN.test(entry.contentType)) {
      errors.push(`contentType for ${entry.associationType} contains unsupported characters.`);
    }
  });
  return associations;
}

export function validateFileUploadInput(input: FileUploadInput) {
  const mediaValidation = validateMediaUploadInput({
    userId: input.userId,
    tenantId: input.tenantId,
    fileName: input.fileName,
    mimeType: input.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    bytes: input.bytes,
    mediaType: input.mediaType,
  });
  const errors = [...mediaValidation.errors];
  const source = input.source;
  const linkedContentId = validateReference(input.linkedContentId, "linkedContentId", errors);
  const linkedContentType = trimOptional(input.linkedContentType);
  const retryUploadId = validateReference(input.retryUploadId, "retryUploadId", errors);
  const usageContext = parseUsageContext(input.usageContext) ?? inferUsageContextFromSource(source as FileUploadSource);
  const associations = validateAssociations(input.associations, errors);

  if (linkedContentId && !linkedContentType) {
    errors.push("linkedContentType is required when linkedContentId is provided.");
  }

  if (input.bytes.length !== input.fileSizeBytes) {
    errors.push("File payload size does not match declared file size.");
  }

  return {
    ok: errors.length === 0,
    errors,
    normalized: {
      ...mediaValidation.normalized,
      source,
      linkedContentId,
      linkedContentType,
      retryUploadId,
      usageContext,
      associations,
      metadata: normalizeMetadata(input.metadata),
    },
  };
}

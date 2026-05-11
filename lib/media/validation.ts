import { config } from "@/config";
import { inferMediaType } from "./model";
import type { MediaDimensions, MediaType, MediaUploadInput } from "./types";

const MAX_FILENAME_LENGTH = 200;

const DEFAULT_ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];


export interface MediaValidationResult {
  ok: boolean;
  errors: string[];
  normalized: {
    mediaType: MediaType;
    mimeType: string;
    fileName: string;
    dimensions?: MediaDimensions;
  };
}

function normalizeAllowedMimeTypes(): string[] {
  const configured = config.services.media.allowedMimeTypes;
  if (!configured || configured.length === 0) {
    return DEFAULT_ALLOWED_MIME_TYPES;
  }

  return configured.map((entry) => entry.trim().toLowerCase()).filter(Boolean);
}

function normalizeFileName(fileName: string): string {
  const trimmed = fileName.trim();
  if (!trimmed) return "upload.bin";
  return trimmed.slice(0, MAX_FILENAME_LENGTH);
}

export function validateMediaUploadInput(input: MediaUploadInput): MediaValidationResult {
  const errors: string[] = [];
  const allowedMimeTypes = normalizeAllowedMimeTypes();
  const mimeType = input.mimeType.trim().toLowerCase();
  const mediaType = input.mediaType ?? inferMediaType(mimeType);

  if (!mimeType) {
    errors.push("mimeType is required.");
  } else if (!allowedMimeTypes.includes(mimeType)) {
    errors.push(`Unsupported mime type: ${mimeType}`);
  }

  if (!input.fileName.trim()) {
    errors.push("fileName is required.");
  }

  if (!Number.isFinite(input.fileSizeBytes) || input.fileSizeBytes < 1) {
    errors.push("File size must be greater than 0 bytes.");
  }

  if (input.fileSizeBytes > config.services.media.maxUploadBytes) {
    errors.push(`File exceeds max size of ${config.services.media.maxUploadBytes} bytes.`);
  }

  if (mediaType === "video" && input.fileSizeBytes > config.services.media.maxVideoBytes) {
    errors.push(`Video exceeds max size of ${config.services.media.maxVideoBytes} bytes.`);
  }

  if (mediaType === "image") {
    if (input.width && input.width > config.services.media.maxImageDimension) {
      errors.push(`Image width exceeds ${config.services.media.maxImageDimension}px.`);
    }
    if (input.height && input.height > config.services.media.maxImageDimension) {
      errors.push(`Image height exceeds ${config.services.media.maxImageDimension}px.`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    normalized: {
      mediaType,
      mimeType,
      fileName: normalizeFileName(input.fileName),
      dimensions:
        input.width || input.height
          ? {
              width: input.width,
              height: input.height,
            }
          : undefined,
    },
  };
}

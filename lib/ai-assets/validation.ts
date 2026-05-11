import { config } from "@/config";
import { hashPrompt } from "./model";
import { isAiAssetStatus } from "./lifecycle";
import { validateAiAssetAssociation } from "./associations";
import type { AiAssetGenerationTarget, RegisterAiAssetInput } from "./types";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export interface AiAssetValidationResult {
  ok: boolean;
  errors: string[];
  normalized: {
    tenantId?: string;
    fileName?: string;
    mimeType?: string;
    fileSizeBytes?: number;
    promptText?: string;
    promptHash?: string;
    status: RegisterAiAssetInput["status"];
    generationSettings: Record<string, unknown>;
    generationTarget: AiAssetGenerationTarget;
    linkedContentId?: string;
    linkedContentType?: string;
  };
}

export function validateRegisterAiAssetInput(input: RegisterAiAssetInput): AiAssetValidationResult {
  const errors: string[] = [];
  const fileName = input.fileName?.trim();
  const mimeType = input.mimeType?.trim().toLowerCase();
  const promptText = input.promptText?.trim();

  if (!input.userId.trim()) {
    errors.push("userId is required.");
  }

  if (!input.mediaId && !input.bytes) {
    errors.push("Either mediaId or bytes is required.");
  }

  if (input.bytes) {
    if (!fileName) {
      errors.push("fileName is required when bytes are provided.");
    }
    if (!mimeType) {
      errors.push("mimeType is required when bytes are provided.");
    }
    if (!Number.isFinite(input.fileSizeBytes) || (input.fileSizeBytes ?? 0) < 1) {
      errors.push("fileSizeBytes must be greater than 0.");
    }
  }

  if (mimeType && !ALLOWED_MIME_TYPES.includes(mimeType)) {
    errors.push(`Unsupported MIME type: ${mimeType}`);
  }

  if (input.fileSizeBytes && input.fileSizeBytes > config.services.media.maxUploadBytes) {
    errors.push(`File exceeds max size of ${config.services.media.maxUploadBytes} bytes.`);
  }

  if (input.width && input.width > config.services.media.maxImageDimension) {
    errors.push(`Image width exceeds ${config.services.media.maxImageDimension}px.`);
  }

  if (input.height && input.height > config.services.media.maxImageDimension) {
    errors.push(`Image height exceeds ${config.services.media.maxImageDimension}px.`);
  }

  if (input.status && !isAiAssetStatus(input.status)) {
    errors.push("status is invalid.");
  }

  errors.push(...validateAiAssetAssociation({
    linkedContentId: input.linkedContentId,
    linkedContentType: input.linkedContentType,
  }));

  return {
    ok: errors.length === 0,
    errors,
    normalized: {
      tenantId: input.tenantId?.trim() || undefined,
      fileName,
      mimeType,
      fileSizeBytes: input.fileSizeBytes,
      promptText,
      promptHash: hashPrompt(promptText),
      status: input.status,
      generationSettings: input.generationSettings ?? {},
      generationTarget: input.generationTarget ?? {},
      linkedContentId: input.linkedContentId?.trim() || undefined,
      linkedContentType: input.linkedContentType?.trim() || undefined,
    },
  };
}

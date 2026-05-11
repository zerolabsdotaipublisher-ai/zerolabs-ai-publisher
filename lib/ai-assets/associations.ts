import type { AiAssetContentAssociation } from "./types";

const LINKED_CONTENT_TYPES = new Set(["website_page", "blog_post", "article", "social_post", "campaign", "other"]);

export function normalizeAiAssetAssociation(input: AiAssetContentAssociation): AiAssetContentAssociation {
  const linkedContentId = input.linkedContentId?.trim() || undefined;
  const linkedContentType = input.linkedContentType?.trim() || undefined;
  const contentTarget = input.contentTarget?.trim() || undefined;

  return {
    linkedContentId,
    linkedContentType,
    contentTarget,
  };
}

export function validateAiAssetAssociation(input: AiAssetContentAssociation): string[] {
  const errors: string[] = [];
  const normalized = normalizeAiAssetAssociation(input);

  if (normalized.linkedContentId && !normalized.linkedContentType) {
    errors.push("linkedContentType is required when linkedContentId is provided.");
  }

  if (normalized.linkedContentType && !LINKED_CONTENT_TYPES.has(normalized.linkedContentType)) {
    errors.push("linkedContentType is invalid.");
  }

  if (normalized.linkedContentId && normalized.linkedContentType && !normalized.linkedContentId.includes(":")) {
    errors.push("linkedContentId should use '<type>:<sourceId>' format.");
  }

  return errors;
}

import type { EditingContentType, SaveEditableContentPayload } from "./types";

const VALID_CONTENT_TYPES: EditingContentType[] = ["website_page", "blog_post", "article", "social_post"];

export function normalizeEditingContentIdParam(value: string): string {
  return decodeURIComponent(value).trim();
}

export function parseEditingContentType(value: string): EditingContentType | undefined {
  return VALID_CONTENT_TYPES.includes(value as EditingContentType) ? (value as EditingContentType) : undefined;
}

export function parseEditableSavePayload(value: unknown): SaveEditableContentPayload | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as SaveEditableContentPayload;
  if (!record.draft || typeof record.draft !== "object") {
    return null;
  }

  return record;
}

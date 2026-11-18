import { routes } from "@/config/routes";
import type { CommunityPostAttachment, SharedWebsiteAttachment } from "./types";

export type SharedWebsiteRecord = {
  id: string;
  site_title?: string | null;
  visibility?: string | null;
  status?: string | null;
  deleted_at?: string | null;
  structure?: unknown;
};

function getNonEmptyText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getPublicationString(structure: unknown, key: "liveUrl" | "livePath"): string | null {
  if (!isRecord(structure) || !isRecord(structure.publication)) return null;
  return getNonEmptyText(structure.publication[key]);
}

function getSafePublishedUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}

function getSafeLiveSitePath(value: string | null, websiteId: string): string | null {
  if (!value) return null;

  const canonicalPath = routes.liveSite(websiteId);
  return value === canonicalPath
    || value.startsWith(`${canonicalPath}/`)
    || value.startsWith(`${canonicalPath}?`)
    || value.startsWith(`${canonicalPath}#`)
    ? value
    : null;
}

/**
 * Website attachments persist the website record identifier in metadata. The
 * `website:` storage-path sentinel is a compatibility fallback for attachments
 * created by the same Feed workflow before metadata was present.
 */
export function getSharedWebsiteId(attachment: CommunityPostAttachment): string | null {
  const metadataId = getNonEmptyText(attachment.metadata?.website_id);
  if (metadataId) return metadataId;

  const storagePath = getNonEmptyText(attachment.storage_path);
  return storagePath?.startsWith("website:") ? getNonEmptyText(storagePath.slice("website:".length)) : null;
}

/**
 * Uses the current website record, not Feed snapshot data, to decide whether
 * and where a shared website may be opened.
 */
export function resolveSharedWebsiteAttachment(
  attachment: CommunityPostAttachment,
  website: SharedWebsiteRecord | null | undefined,
): SharedWebsiteAttachment | null {
  const websiteId = getSharedWebsiteId(attachment);
  if (!websiteId) return null;

  const title = getNonEmptyText(website?.site_title) ?? getNonEmptyText(attachment.file_name);
  const isPubliclyAvailable = website?.id === websiteId
    && website.visibility === "public"
    && website.status === "published"
    && !website.deleted_at;

  if (!isPubliclyAvailable) {
    return { id: websiteId, title, href: null, isExternal: false };
  }

  const liveUrl = getSafePublishedUrl(getPublicationString(website.structure, "liveUrl"));
  if (liveUrl) {
    return { id: websiteId, title, href: liveUrl, isExternal: true };
  }

  const livePath = getSafeLiveSitePath(getPublicationString(website.structure, "livePath"), websiteId);
  return { id: websiteId, title, href: livePath ?? routes.liveSite(websiteId), isExternal: false };
}

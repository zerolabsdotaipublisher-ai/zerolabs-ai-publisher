import type { WebsiteMediaLibraryItem } from "@/lib/website-media-library/types";
import type { StorageAccessOperation, StorageVisibility } from "./types";

export function isPublicStorageOperation(operation: StorageAccessOperation): boolean {
  return operation === "read" || operation === "preview" || operation === "download" || operation === "signed_url";
}

export function resolveWebsiteMediaVisibility(
  item: Pick<WebsiteMediaLibraryItem, "archivedAt" | "deletedAt">,
  publicationState?: string,
): StorageVisibility {
  if (item.deletedAt || item.archivedAt) {
    return "private";
  }

  if (publicationState === "published") {
    return "public";
  }

  return "private";
}

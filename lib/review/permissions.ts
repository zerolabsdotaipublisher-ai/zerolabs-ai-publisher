import type { ContentLibraryItem } from "@/lib/content/library";

export interface ReviewPermissionResult {
  allowed: boolean;
  reason?: string;
}

export function canReviewContent(item: ContentLibraryItem | null): ReviewPermissionResult {
  if (!item) {
    return { allowed: false, reason: "Content not found" };
  }

  if (item.status === "deleted") {
    return { allowed: false, reason: "Deleted content cannot be reviewed" };
  }

  return { allowed: true };
}

export function canTriggerReviewAction(item: ContentLibraryItem | null): ReviewPermissionResult {
  return canReviewContent(item);
}

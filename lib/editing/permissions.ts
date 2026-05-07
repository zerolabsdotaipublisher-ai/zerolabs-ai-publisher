import type { ReviewDetail } from "@/lib/review";

export interface EditingPermissionResult {
  allowed: boolean;
  reason?: string;
}

export function canEditOwnedContent(detail: ReviewDetail | null): EditingPermissionResult {
  if (!detail) {
    return { allowed: false, reason: "Content not found" };
  }

  if (detail.item.status === "deleted") {
    return { allowed: false, reason: "Deleted content cannot be edited" };
  }

  return { allowed: true };
}

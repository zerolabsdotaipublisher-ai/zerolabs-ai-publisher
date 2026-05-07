import type { ReviewDetail } from "@/lib/review/types";

export interface RegenerationPermissionResult {
  allowed: boolean;
  reason?: string;
}

export function canRegenerateOwnedContent(detail: ReviewDetail | null): RegenerationPermissionResult {
  if (!detail) {
    return { allowed: false, reason: "Content not found" };
  }

  if (detail.item.status === "deleted") {
    return { allowed: false, reason: "Deleted content cannot be regenerated" };
  }

  return { allowed: true };
}


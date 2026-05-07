import type { ContentLibraryItem } from "@/lib/content/library";
import type { ApprovalRole, ApprovalState } from "./types";

export interface ApprovalPermissionResult {
  allowed: boolean;
  reason?: string;
}

export function canViewApproval(item: ContentLibraryItem | null): ApprovalPermissionResult {
  if (!item) {
    return { allowed: false, reason: "Content not found" };
  }

  if (item.status === "deleted") {
    return { allowed: false, reason: "Deleted content cannot enter approval workflow" };
  }

  return { allowed: true };
}

export function canSubmitForApproval(state: ApprovalState): ApprovalPermissionResult {
  if (state === "draft" || state === "rejected" || state === "needs_changes") {
    return { allowed: true };
  }

  return { allowed: false, reason: "Only draft, rejected, or needs-changes content can be submitted." };
}

export function canDecideApproval(state: ApprovalState, _role: ApprovalRole): ApprovalPermissionResult {
  if (state === "published") {
    return { allowed: false, reason: "Published content cannot be re-decided from approval." };
  }

  if (state === "approved") {
    return { allowed: false, reason: "Content is already approved." };
  }

  return { allowed: true };
}

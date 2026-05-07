import "server-only";

import { listOwnedContentLibraryPage } from "@/lib/content/library";
import { logOwnedApprovalAction } from "./audit";
import { getOwnedApprovalDetail } from "./model";
import { emitApprovalNotificationEvent } from "./notifications";
import { canDecideApproval, canSubmitForApproval } from "./permissions";
import { mapApprovalStateToPersistedDecision, normalizeApprovalRole } from "./schema";
import { createOwnedApprovalComment, setOwnedApprovalDecision } from "./storage";
import type { ApprovalActionResult, ApprovalPublishingGate, ApprovalRole, ApprovalState } from "./types";

// Keep structure-linked approval scans bounded for publish gates.
// 5000 matches existing review/content aggregation limits and avoids per-item fan-out.
const MAX_SOURCE_SCAN = 5000;

function resolveRoleForAction(role: ApprovalRole | undefined, action: "approve" | "reject" | "request_changes"): ApprovalRole {
  const normalized = normalizeApprovalRole(role);

  if (normalized === "creator") {
    return action === "approve" ? "approver" : "reviewer";
  }

  return normalized;
}

async function setApprovalState(input: {
  userId: string;
  contentId: string;
  nextState: ApprovalState;
  action: string;
  role: ApprovalRole;
  note?: string;
  notifyEvent?: "submitted" | "approved" | "rejected" | "changes_requested";
}): Promise<ApprovalActionResult> {
  const detail = await getOwnedApprovalDetail(input.userId, input.contentId);
  if (!detail) {
    return { ok: false, error: "Content not found" };
  }

  const persistedState = mapApprovalStateToPersistedDecision(input.nextState);
  if (!persistedState) {
    return { ok: false, error: "Invalid approval target state" };
  }

  await setOwnedApprovalDecision({
    userId: input.userId,
    contentId: detail.contentId,
    contentType: detail.item.type,
    sourceId: detail.item.sourceId,
    structureId: detail.linkedStructureId,
    state: persistedState,
    note: input.note,
    feedback: {
      approvalAction: input.action,
      role: input.role,
    },
  });

  await logOwnedApprovalAction({
    userId: input.userId,
    contentId: detail.contentId,
    action: input.action,
    actorRole: input.role,
    note: input.note,
    metadata: {
      previousState: detail.approvalState,
      nextState: input.nextState,
      contentType: detail.item.type,
    },
  });

  if (input.notifyEvent) {
    await emitApprovalNotificationEvent({
      event: input.notifyEvent,
      userId: input.userId,
      contentId: detail.contentId,
      nextState: input.nextState,
      note: input.note,
    });
  }

  const refreshed = await getOwnedApprovalDetail(input.userId, detail.contentId);
  return { ok: true, detail: refreshed ?? undefined };
}

export async function submitOwnedContentForApproval(input: {
  userId: string;
  contentId: string;
  role?: ApprovalRole;
  note?: string;
}): Promise<ApprovalActionResult> {
  const role = normalizeApprovalRole(input.role);
  const detail = await getOwnedApprovalDetail(input.userId, input.contentId);
  if (!detail) {
    return { ok: false, error: "Content not found" };
  }

  const permission = canSubmitForApproval(detail.approvalState);
  if (!permission.allowed) {
    return { ok: false, error: permission.reason || "Submit for approval is not allowed." };
  }

  return setApprovalState({
    userId: input.userId,
    contentId: input.contentId,
    nextState: "pending_approval",
    action: "submitted_for_approval",
    role,
    note: input.note,
    notifyEvent: "submitted",
  });
}

export async function approveOwnedContent(input: {
  userId: string;
  contentId: string;
  role?: ApprovalRole;
  note?: string;
}): Promise<ApprovalActionResult> {
  const role = resolveRoleForAction(input.role, "approve");
  const detail = await getOwnedApprovalDetail(input.userId, input.contentId);
  if (!detail) {
    return { ok: false, error: "Content not found" };
  }

  const permission = canDecideApproval(detail.approvalState, role);
  if (!permission.allowed) {
    return { ok: false, error: permission.reason || "Approval is not allowed." };
  }

  return setApprovalState({
    userId: input.userId,
    contentId: input.contentId,
    nextState: "approved",
    action: "approved",
    role,
    note: input.note,
    notifyEvent: "approved",
  });
}

export async function rejectOwnedContent(input: {
  userId: string;
  contentId: string;
  role?: ApprovalRole;
  note?: string;
}): Promise<ApprovalActionResult> {
  const role = resolveRoleForAction(input.role, "reject");
  const detail = await getOwnedApprovalDetail(input.userId, input.contentId);
  if (!detail) {
    return { ok: false, error: "Content not found" };
  }

  const permission = canDecideApproval(detail.approvalState, role);
  if (!permission.allowed) {
    return { ok: false, error: permission.reason || "Rejection is not allowed." };
  }

  return setApprovalState({
    userId: input.userId,
    contentId: input.contentId,
    nextState: "rejected",
    action: "rejected",
    role,
    note: input.note,
    notifyEvent: "rejected",
  });
}

export async function requestOwnedContentChanges(input: {
  userId: string;
  contentId: string;
  role?: ApprovalRole;
  note?: string;
}): Promise<ApprovalActionResult> {
  const role = resolveRoleForAction(input.role, "request_changes");
  const detail = await getOwnedApprovalDetail(input.userId, input.contentId);
  if (!detail) {
    return { ok: false, error: "Content not found" };
  }

  const permission = canDecideApproval(detail.approvalState, role);
  if (!permission.allowed) {
    return { ok: false, error: permission.reason || "Request changes is not allowed." };
  }

  return setApprovalState({
    userId: input.userId,
    contentId: input.contentId,
    nextState: "needs_changes",
    action: "changes_requested",
    role,
    note: input.note,
    notifyEvent: "changes_requested",
  });
}

export async function addOwnedApprovalComment(input: {
  userId: string;
  contentId: string;
  role?: ApprovalRole;
  body: string;
}): Promise<ApprovalActionResult> {
  const role = normalizeApprovalRole(input.role);
  const detail = await getOwnedApprovalDetail(input.userId, input.contentId);
  if (!detail) {
    return { ok: false, error: "Content not found" };
  }

  if (!input.body.trim()) {
    return { ok: false, error: "Comment body is required." };
  }

  await createOwnedApprovalComment({
    userId: input.userId,
    contentId: input.contentId,
    authorRole: role,
    body: input.body,
  });

  await logOwnedApprovalAction({
    userId: input.userId,
    contentId: input.contentId,
    action: "comment_added",
    actorRole: role,
    metadata: {
      approvalState: detail.approvalState,
      contentType: detail.item.type,
    },
  });

  const refreshed = await getOwnedApprovalDetail(input.userId, input.contentId);
  return { ok: true, detail: refreshed ?? undefined };
}

export async function getStructureApprovalPublishingGate(userId: string, structureId: string): Promise<ApprovalPublishingGate> {
  const page = await listOwnedContentLibraryPage(userId, {
    page: 1,
    perPage: MAX_SOURCE_SCAN,
    type: "all",
    status: "all",
    sort: "updated_desc",
    websiteId: structureId,
    search: undefined,
  });

  const linked = page.items.filter((item) => item.linkedWebsite?.structureId === structureId);
  if (linked.length === 0) {
    return {
      blocked: false,
      blockingStates: [],
      blockedContentIds: [],
    };
  }

  const blocked = linked.filter((item) => item.approvalState !== "approved" && item.approvalState !== "published");
  if (blocked.length === 0) {
    return {
      blocked: false,
      blockingStates: [],
      blockedContentIds: [],
    };
  }

  return {
    blocked: true,
    reason: "Publishing is blocked until all linked content is approved.",
    blockingStates: Array.from(new Set(blocked.map((item) => item.approvalState))),
    blockedContentIds: blocked.map((item) => item.id),
  };
}

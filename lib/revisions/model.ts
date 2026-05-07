import type { ContentLibraryType } from "@/lib/content/library";
import type { EditableContentDraft } from "@/lib/editing/types";
import type { ReviewDetail } from "@/lib/review/types";
import type { ContentRevisionSnapshot, ContentRevisionSummary, RevisionActionType } from "./types";

export const REVISION_HISTORY_DEFAULT_PAGE = 1;
export const REVISION_HISTORY_DEFAULT_PER_PAGE = 20;
export const REVISION_HISTORY_MAX_PER_PAGE = 50;

export const AUTOSAVE_REVISION_MIN_MS = 5 * 60 * 1000;

export function createRevisionId(contentId: string, actionType: RevisionActionType, at: string): string {
  const normalizedTimestamp = at.replace(/[^0-9]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 8);
  const safeContentId = contentId.replace(/[^a-zA-Z0-9_:-]/g, "_").slice(0, 48);
  return `rev_${safeContentId}_${actionType}_${normalizedTimestamp}_${suffix}`;
}

export function buildRevisionSummary(snapshot: ContentRevisionSnapshot): ContentRevisionSummary {
  const words = [snapshot.draft.title, snapshot.draft.summary, snapshot.draft.body]
    .join(" ")
    .split(/\s+/)
    .filter(Boolean);

  return {
    title: snapshot.draft.title,
    sectionCount: snapshot.draft.sections.length,
    wordCount: words.length,
    keywordCount: snapshot.draft.metadataSeo.keywords.length,
    mediaReferenceCount: snapshot.draft.media.references.length,
    reviewState: snapshot.reviewState,
    approvalState: snapshot.approvalState,
    contentStatus: snapshot.contentStatus,
  };
}

export function createRevisionChangeSummary(actionType: RevisionActionType, draft: EditableContentDraft): string {
  switch (actionType) {
    case "content_created":
      return `Initial ${draft.type.replaceAll("_", " ")} snapshot created.`;
    case "manual_save":
      return `Manual edit saved for ${draft.type.replaceAll("_", " ")} content.`;
    case "autosave_checkpoint":
      return `Autosave checkpoint captured for ${draft.type.replaceAll("_", " ")} content.`;
    case "ai_regenerate":
      return `AI regeneration updated ${draft.type.replaceAll("_", " ")} content.`;
    case "approval_submit":
      return "Content submitted for approval.";
    case "approval_approve":
      return "Content approved.";
    case "approval_reject":
      return "Content rejected in approval workflow.";
    case "approval_request_changes":
      return "Changes requested during approval.";
    case "publish":
      return "Published snapshot recorded.";
    case "publish_update":
      return "Published update snapshot recorded.";
    case "restore":
      return "Content restored from historical revision.";
    default:
      return "Content revision recorded.";
  }
}

export function clampRevisionPage(input?: number): number {
  if (!input || input < 1) {
    return REVISION_HISTORY_DEFAULT_PAGE;
  }
  return input;
}

export function clampRevisionPerPage(input?: number): number {
  if (!input || input < 1) {
    return REVISION_HISTORY_DEFAULT_PER_PAGE;
  }

  return Math.min(REVISION_HISTORY_MAX_PER_PAGE, input);
}

export function createSnapshotFromReviewDetail(detail: ReviewDetail, draft: EditableContentDraft): ContentRevisionSnapshot {
  return {
    schemaVersion: 1,
    capturedAt: draft.updatedAt,
    draft,
    reviewState: detail.reviewState,
    approvalState: detail.item.approvalState,
    contentStatus: detail.item.status,
  };
}

export function toRevisionWorkflowIdMap(input?: {
  requestId?: string;
  approvalId?: string;
  publishRequestId?: string;
  restoreFromRevisionId?: string;
}): Record<string, string> {
  const map: Record<string, string> = {};
  if (input?.requestId) {
    map.requestId = input.requestId;
  }
  if (input?.approvalId) {
    map.approvalId = input.approvalId;
  }
  if (input?.publishRequestId) {
    map.publishRequestId = input.publishRequestId;
  }
  if (input?.restoreFromRevisionId) {
    map.restoreFromRevisionId = input.restoreFromRevisionId;
  }
  return map;
}

export function normalizeRevisionSourceType(type: ContentLibraryType): ContentLibraryType {
  return type;
}

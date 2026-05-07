import type { ContentApprovalState, ContentLibraryStatus, ContentLibraryType } from "@/lib/content/library";
import type { EditableContentDraft } from "@/lib/editing/types";
import type { ReviewState } from "@/lib/review/types";

export type RevisionActionType =
  | "content_created"
  | "manual_save"
  | "autosave_checkpoint"
  | "ai_regenerate"
  | "approval_submit"
  | "approval_approve"
  | "approval_reject"
  | "approval_request_changes"
  | "publish"
  | "publish_update"
  | "restore";

export type RevisionAuditAction = "created" | "restored" | "listed" | "viewed" | "compared";

export interface ContentRevisionSnapshot {
  schemaVersion: 1;
  capturedAt: string;
  draft: EditableContentDraft;
  reviewState: ReviewState;
  approvalState: ContentApprovalState;
  contentStatus: ContentLibraryStatus;
}

export interface ContentRevisionSummary {
  title: string;
  sectionCount: number;
  wordCount: number;
  keywordCount: number;
  mediaReferenceCount: number;
  reviewState: ReviewState;
  approvalState: ContentApprovalState;
  contentStatus: ContentLibraryStatus;
}

export interface ContentRevisionRecord {
  id: string;
  userId: string;
  contentId: string;
  contentType: ContentLibraryType;
  sourceId: string;
  structureId?: string;
  versionNumber: number;
  actionType: RevisionActionType;
  changeSummary: string;
  snapshot: ContentRevisionSnapshot;
  summary: ContentRevisionSummary;
  metadata: Record<string, unknown>;
  relatedWorkflowIds: Record<string, string>;
  restoredFromRevisionId?: string;
  createdAt: string;
}

export interface ContentRevisionRow {
  id: string;
  user_id: string;
  content_id: string;
  content_type: ContentLibraryType;
  source_id: string;
  structure_id?: string | null;
  version_number: number;
  action_type: RevisionActionType;
  change_summary: string;
  snapshot_json: ContentRevisionSnapshot;
  summary_json: ContentRevisionSummary;
  metadata_json: Record<string, unknown>;
  related_workflow_ids: Record<string, string>;
  restored_from_revision_id?: string | null;
  created_at: string;
}

export interface ContentRevisionAuditEntry {
  id: string;
  userId: string;
  contentId: string;
  revisionId?: string;
  action: RevisionAuditAction;
  actorUserId: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ContentRevisionAuditRow {
  id: string;
  user_id: string;
  content_id: string;
  revision_id?: string | null;
  action: RevisionAuditAction;
  actor_user_id: string;
  metadata_json: unknown;
  created_at: string;
}

export interface RevisionCompareResult {
  comparedAt: string;
  leftRevisionId: string;
  rightRevisionId: string;
  leftVersionNumber: number;
  rightVersionNumber: number;
  summary: string;
  changedFields: string[];
  changedSections: number;
  keywordDelta: number;
}

export interface CreateContentRevisionInput {
  userId: string;
  contentId: string;
  contentType: ContentLibraryType;
  sourceId: string;
  structureId?: string;
  actionType: RevisionActionType;
  changeSummary: string;
  snapshot: ContentRevisionSnapshot;
  summary: ContentRevisionSummary;
  metadata?: Record<string, unknown>;
  relatedWorkflowIds?: Record<string, string>;
  restoredFromRevisionId?: string;
  createdAt?: string;
}

export interface ListContentRevisionsOptions {
  page: number;
  perPage: number;
}

export interface ListContentRevisionsResult {
  entries: ContentRevisionRecord[];
  page: number;
  perPage: number;
  hasMore: boolean;
}

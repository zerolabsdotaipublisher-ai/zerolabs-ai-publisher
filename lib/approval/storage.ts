import "server-only";

import type { ContentLibraryType } from "@/lib/content/library";
import { getOwnedReviewRecord, listOwnedReviewRecords, upsertOwnedReviewRecord } from "@/lib/review/storage";
import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type {
  ApprovalAuditEntry,
  ApprovalAuditRow,
  ApprovalComment,
  ApprovalCommentRow,
  PersistedApprovalDecisionState,
} from "./types";

function fromCommentRow(row: ApprovalCommentRow): ApprovalComment {
  return {
    id: row.id,
    userId: row.user_id,
    contentId: row.content_id,
    authorRole: row.author_role,
    body: row.body,
    createdAt: row.created_at,
  };
}

function fromAuditRow(row: ApprovalAuditRow): ApprovalAuditEntry {
  return {
    id: row.id,
    userId: row.user_id,
    contentId: row.content_id,
    action: row.action,
    actorRole: row.actor_role,
    note: row.note ?? undefined,
    metadata: (row.metadata_json ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

export async function listOwnedApprovalDecisionRecords(userId: string) {
  return listOwnedReviewRecords(userId);
}

export async function getOwnedApprovalDecisionRecord(userId: string, contentId: string) {
  return getOwnedReviewRecord(userId, contentId);
}

export async function setOwnedApprovalDecision(input: {
  userId: string;
  contentId: string;
  contentType: ContentLibraryType;
  sourceId: string;
  structureId?: string;
  state: PersistedApprovalDecisionState;
  note?: string;
  feedback?: Record<string, unknown>;
}) {
  return upsertOwnedReviewRecord({
    userId: input.userId,
    contentId: input.contentId,
    contentType: input.contentType,
    sourceId: input.sourceId,
    structureId: input.structureId,
    state: input.state,
    decisionNote: input.note,
    feedback: input.feedback,
  });
}

export async function listOwnedApprovalComments(userId: string, contentId: string): Promise<ApprovalComment[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("ai_content_approval_comments")
    .select("*")
    .eq("user_id", userId)
    .eq("content_id", contentId)
    .order("created_at", { ascending: true })
    .limit(200);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ApprovalCommentRow[]).map(fromCommentRow);
}

export async function createOwnedApprovalComment(input: {
  userId: string;
  contentId: string;
  authorRole: ApprovalComment["authorRole"];
  body: string;
}): Promise<ApprovalComment> {
  const supabase = getSupabaseServiceClient();
  const row = {
    id: `acomment_${crypto.randomUUID()}`,
    user_id: input.userId,
    content_id: input.contentId,
    author_role: input.authorRole,
    body: input.body.trim(),
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("ai_content_approval_comments").insert(row).select("*").single();

  if (error) {
    throw error;
  }

  return fromCommentRow(data as ApprovalCommentRow);
}

export async function listOwnedApprovalAuditEntries(userId: string, contentId: string): Promise<ApprovalAuditEntry[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("ai_content_approval_audit")
    .select("*")
    .eq("user_id", userId)
    .eq("content_id", contentId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ApprovalAuditRow[]).map(fromAuditRow);
}

export async function appendOwnedApprovalAuditEntry(input: {
  userId: string;
  contentId: string;
  action: string;
  actorRole: ApprovalAuditEntry["actorRole"];
  note?: string;
  metadata?: Record<string, unknown>;
}): Promise<ApprovalAuditEntry> {
  const supabase = getSupabaseServiceClient();
  const row = {
    id: `aaudit_${crypto.randomUUID()}`,
    user_id: input.userId,
    content_id: input.contentId,
    action: input.action,
    actor_role: input.actorRole,
    note: input.note?.trim() || null,
    metadata_json: input.metadata ?? {},
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("ai_content_approval_audit").insert(row).select("*").single();

  if (error) {
    throw error;
  }

  return fromAuditRow(data as ApprovalAuditRow);
}

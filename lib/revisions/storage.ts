import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { createRevisionId } from "./model";
import type {
  ContentRevisionAuditEntry,
  ContentRevisionAuditRow,
  ContentRevisionRecord,
  ContentRevisionRow,
  CreateContentRevisionInput,
  ListContentRevisionsOptions,
  ListContentRevisionsResult,
  RevisionAuditAction,
} from "./types";

function fromRow(row: ContentRevisionRow): ContentRevisionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    contentId: row.content_id,
    contentType: row.content_type,
    sourceId: row.source_id,
    structureId: row.structure_id ?? undefined,
    versionNumber: row.version_number,
    actionType: row.action_type,
    changeSummary: row.change_summary,
    snapshot: row.snapshot_json,
    summary: row.summary_json,
    metadata: row.metadata_json ?? {},
    relatedWorkflowIds: row.related_workflow_ids ?? {},
    restoredFromRevisionId: row.restored_from_revision_id ?? undefined,
    createdAt: row.created_at,
  };
}

function fromAuditRow(row: ContentRevisionAuditRow): ContentRevisionAuditEntry {
  return {
    id: row.id,
    userId: row.user_id,
    contentId: row.content_id,
    revisionId: row.revision_id ?? undefined,
    action: row.action,
    actorUserId: row.actor_user_id,
    metadata: (row.metadata_json ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

export async function listContentRevisions(
  userId: string,
  contentId: string,
  options: ListContentRevisionsOptions,
): Promise<ListContentRevisionsResult> {
  const supabase = getSupabaseServiceClient();
  const offset = (options.page - 1) * options.perPage;

  const { data, error } = await supabase
    .from("ai_content_revisions")
    .select("*")
    .eq("user_id", userId)
    .eq("content_id", contentId)
    .order("version_number", { ascending: false })
    .range(offset, offset + options.perPage);

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as ContentRevisionRow[];
  const entries = rows.slice(0, options.perPage).map(fromRow);

  return {
    entries,
    page: options.page,
    perPage: options.perPage,
    hasMore: rows.length > options.perPage,
  };
}

export async function getContentRevision(
  userId: string,
  contentId: string,
  revisionId: string,
): Promise<ContentRevisionRecord | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("ai_content_revisions")
    .select("*")
    .eq("user_id", userId)
    .eq("content_id", contentId)
    .eq("id", revisionId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? fromRow(data as ContentRevisionRow) : null;
}

export async function getLatestContentRevision(userId: string, contentId: string): Promise<ContentRevisionRecord | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("ai_content_revisions")
    .select("*")
    .eq("user_id", userId)
    .eq("content_id", contentId)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? fromRow(data as ContentRevisionRow) : null;
}

export async function createContentRevision(input: CreateContentRevisionInput): Promise<ContentRevisionRecord> {
  const supabase = getSupabaseServiceClient();
  const createdAt = input.createdAt ?? new Date().toISOString();
  const revisionId = createRevisionId(input.contentId, input.actionType, createdAt);

  const { data, error } = await supabase.rpc("insert_ai_content_revision", {
    p_id: revisionId,
    p_user_id: input.userId,
    p_content_id: input.contentId,
    p_content_type: input.contentType,
    p_source_id: input.sourceId,
    p_structure_id: input.structureId ?? null,
    p_action_type: input.actionType,
    p_change_summary: input.changeSummary,
    p_snapshot_json: input.snapshot,
    p_summary_json: input.summary,
    p_metadata_json: input.metadata ?? {},
    p_related_workflow_ids: input.relatedWorkflowIds ?? {},
    p_restored_from_revision_id: input.restoredFromRevisionId ?? null,
    p_created_at: createdAt,
  });

  if (error) {
    throw error;
  }

  return fromRow((Array.isArray(data) ? data[0] : data) as ContentRevisionRow);
}

export async function appendRevisionAuditEntry(input: {
  userId: string;
  contentId: string;
  actorUserId: string;
  action: RevisionAuditAction;
  revisionId?: string;
  metadata?: Record<string, unknown>;
}): Promise<ContentRevisionAuditEntry> {
  const supabase = getSupabaseServiceClient();
  const row = {
    id: `raudit_${crypto.randomUUID()}`,
    user_id: input.userId,
    content_id: input.contentId,
    revision_id: input.revisionId ?? null,
    action: input.action,
    actor_user_id: input.actorUserId,
    metadata_json: input.metadata ?? {},
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase.from("ai_content_revision_audit").insert(row).select("*").single();

  if (error) {
    throw error;
  }

  return fromAuditRow(data as ContentRevisionAuditRow);
}

export async function listRevisionAuditEntries(userId: string, contentId: string): Promise<ContentRevisionAuditEntry[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("ai_content_revision_audit")
    .select("*")
    .eq("user_id", userId)
    .eq("content_id", contentId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return ((data ?? []) as ContentRevisionAuditRow[]).map(fromAuditRow);
}

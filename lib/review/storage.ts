import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { ContentLibraryType } from "@/lib/content/library";
import type { ReviewDecisionState, ReviewRecord, ReviewRecordRow } from "./types";

function fromRow(row: ReviewRecordRow): ReviewRecord {
  return {
    userId: row.user_id,
    contentId: row.content_id,
    contentType: row.content_type,
    sourceId: row.source_id,
    structureId: row.structure_id ?? undefined,
    state: row.state,
    decisionNote: row.decision_note ?? undefined,
    feedback: (row.feedback_json ?? {}) as Record<string, unknown>,
    approvedAt: row.approved_at ?? undefined,
    rejectedAt: row.rejected_at ?? undefined,
    lastReviewedAt: row.last_reviewed_at ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listOwnedReviewRecords(userId: string): Promise<ReviewRecord[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("ai_content_reviews")
    .select("*")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as ReviewRecordRow[]).map(fromRow);
}

export async function getOwnedReviewRecord(userId: string, contentId: string): Promise<ReviewRecord | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("ai_content_reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("content_id", contentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ? fromRow(data as ReviewRecordRow) : null;
}

interface UpsertOwnedReviewRecordInput {
  userId: string;
  contentId: string;
  contentType: ContentLibraryType;
  sourceId: string;
  structureId?: string;
  state: ReviewDecisionState;
  decisionNote?: string;
  feedback?: Record<string, unknown>;
}

export async function upsertOwnedReviewRecord(input: UpsertOwnedReviewRecordInput): Promise<ReviewRecord> {
  const supabase = getSupabaseServiceClient();
  const now = new Date().toISOString();

  const row: Omit<ReviewRecordRow, "created_at" | "updated_at"> & { created_at?: string; updated_at?: string } = {
    user_id: input.userId,
    content_id: input.contentId,
    content_type: input.contentType,
    source_id: input.sourceId,
    structure_id: input.structureId ?? null,
    state: input.state,
    decision_note: input.decisionNote === undefined ? null : (input.decisionNote.trim() || null),
    feedback_json: input.feedback ?? {},
    approved_at: input.state === "approved" ? now : null,
    rejected_at: input.state === "rejected" || input.state === "needs_changes" ? now : null,
    last_reviewed_at: now,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("ai_content_reviews")
    .upsert(row, { onConflict: "user_id,content_id" })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return fromRow(data as ReviewRecordRow);
}

export async function listOwnedStructureReviewRecords(userId: string, structureId: string): Promise<ReviewRecord[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("ai_content_reviews")
    .select("*")
    .eq("user_id", userId)
    .eq("structure_id", structureId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw error;
  }

  return ((data ?? []) as ReviewRecordRow[]).map(fromRow);
}

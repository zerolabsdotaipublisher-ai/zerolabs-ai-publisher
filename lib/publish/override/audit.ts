import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { ManualOverrideAuditEntry } from "./types";

interface ManualOverrideAuditRow {
  id: string;
  user_id: string;
  override_user_id: string;
  structure_id?: string | null;
  content_id?: string | null;
  target_content_id: string;
  target_content_type: string;
  override_used: boolean;
  override_reason: string;
  override_scenario: string;
  override_timestamp: string;
  bypassed_workflows: string[];
  approval_bypassed: boolean;
  metadata_json: unknown;
  created_at: string;
}

function fromRow(row: ManualOverrideAuditRow): ManualOverrideAuditEntry {
  return {
    id: row.id,
    userId: row.user_id,
    overrideUserId: row.override_user_id,
    structureId: row.structure_id ?? undefined,
    contentId: row.content_id ?? undefined,
    targetContentId: row.target_content_id,
    targetContentType: row.target_content_type as ManualOverrideAuditEntry["targetContentType"],
    overrideUsed: row.override_used,
    overrideReason: row.override_reason,
    overrideScenario: row.override_scenario as ManualOverrideAuditEntry["overrideScenario"],
    overrideTimestamp: row.override_timestamp,
    bypassedWorkflows: row.bypassed_workflows as ManualOverrideAuditEntry["bypassedWorkflows"],
    approvalBypassed: row.approval_bypassed,
    metadata: (row.metadata_json ?? {}) as Record<string, unknown>,
    createdAt: row.created_at,
  };
}

export async function appendManualOverrideAuditEntry(input: Omit<ManualOverrideAuditEntry, "id" | "createdAt">): Promise<ManualOverrideAuditEntry> {
  const supabase = getSupabaseServiceClient();

  const row = {
    id: `poverride_${crypto.randomUUID()}`,
    user_id: input.userId,
    override_user_id: input.overrideUserId,
    structure_id: input.structureId ?? null,
    content_id: input.contentId ?? null,
    target_content_id: input.targetContentId,
    target_content_type: input.targetContentType,
    override_used: input.overrideUsed,
    override_reason: input.overrideReason,
    override_scenario: input.overrideScenario,
    override_timestamp: input.overrideTimestamp,
    bypassed_workflows: input.bypassedWorkflows,
    approval_bypassed: input.approvalBypassed,
    metadata_json: input.metadata,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("publish_manual_override_audit")
    .insert(row)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return fromRow(data as ManualOverrideAuditRow);
}

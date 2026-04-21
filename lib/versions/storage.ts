import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability";
import { createVersionAuditEntry, createVersionStatusAuditEntry } from "./audit";
import { clampVersionHistoryLimit, createWebsiteVersionId } from "./model";
import { createWebsiteVersionSnapshot } from "./snapshots";
import type { CreateWebsiteVersionParams, WebsiteVersionRecord, WebsiteVersionRow } from "./types";

function fromRow(row: WebsiteVersionRow): WebsiteVersionRecord {
  return {
    id: row.id,
    structureId: row.structure_id,
    userId: row.user_id,
    versionNumber: row.version_number,
    label: row.label,
    status: row.status,
    source: row.source,
    structureVersion: row.structure_version,
    snapshot: row.snapshot,
    fingerprint: row.fingerprint,
    summary: row.summary,
    deployment: row.deployment ?? undefined,
    comparison: row.comparison ?? undefined,
    isLive: row.is_live,
    isCurrentDraft: row.is_current_draft,
    restoredFromVersionId: row.restored_from_version_id ?? undefined,
    audit: row.audit,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

interface ListWebsiteVersionsOptions {
  limit?: number;
}

export async function listWebsiteVersions(
  structureId: string,
  userId: string,
  options?: ListWebsiteVersionsOptions,
): Promise<WebsiteVersionRecord[]> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_versions")
    .select("*")
    .eq("structure_id", structureId)
    .eq("user_id", userId)
    .order("version_number", { ascending: false })
    .limit(clampVersionHistoryLimit(options?.limit));

  if (error) {
    logger.error("Failed to list website versions", {
      category: "error",
      service: "supabase",
      structureId,
      userId,
      error: {
        name: "SupabaseWebsiteVersionError",
        message: error.message,
      },
    });
    throw error;
  }

  return ((data ?? []) as WebsiteVersionRow[]).map(fromRow);
}

export async function getWebsiteVersion(
  structureId: string,
  versionId: string,
  userId: string,
): Promise<WebsiteVersionRecord | null> {
  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase
    .from("website_versions")
    .select("*")
    .eq("id", versionId)
    .eq("structure_id", structureId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    logger.error("Failed to fetch website version", {
      category: "error",
      service: "supabase",
      structureId,
      versionId,
      userId,
      error: {
        name: "SupabaseWebsiteVersionError",
        message: error.message,
      },
    });
    throw error;
  }

  return data ? fromRow(data as WebsiteVersionRow) : null;
}

export async function createWebsiteVersion(params: CreateWebsiteVersionParams): Promise<WebsiteVersionRecord> {
  const createdAt = params.structure.updatedAt;
  const versionId = createWebsiteVersionId(params.structure.id, params.source, createdAt);
  const snapshotBundle = createWebsiteVersionSnapshot(params.structure);
  const audit = [
    params.createAuditEntry ??
      createVersionAuditEntry({
        at: createdAt,
        actorUserId: params.userId,
        source: params.source,
        action: params.source === "restore" ? "restored" : "created",
        message: `Website version snapshot created from ${params.source.replace(/_/g, " ")}.`,
        requestId: params.requestId,
        details: {
          structureVersion: params.structure.version,
          status: params.status,
          deploymentId: params.deployment?.deploymentId,
          live: params.status === "published",
        },
      }),
    createVersionStatusAuditEntry({
      at: createdAt,
      actorUserId: params.userId,
      source: params.source,
      nextStatus: params.status,
      requestId: params.requestId,
    }),
  ];

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.rpc("insert_website_version", {
    p_id: versionId,
    p_structure_id: params.structure.id,
    p_user_id: params.userId,
    p_label: params.label,
    p_status: params.status,
    p_source: params.source,
    p_structure_version: params.structure.version,
    p_is_live: params.status === "published",
    p_is_current_draft: true,
    p_snapshot: snapshotBundle.snapshot,
    p_fingerprint: snapshotBundle.fingerprint,
    p_summary: snapshotBundle.summary,
    p_deployment: params.deployment ?? null,
    p_comparison: params.comparison ?? null,
    p_restored_from_version_id: params.restoredFromVersionId ?? null,
    p_audit: audit,
    p_created_at: createdAt,
  });

  if (error) {
    logger.error("Failed to create website version", {
      category: "error",
      service: "supabase",
      structureId: params.structure.id,
      userId: params.userId,
      error: {
        name: "SupabaseWebsiteVersionError",
        message: error.message,
      },
    });
    throw error;
  }

  return fromRow((Array.isArray(data) ? data[0] : data) as WebsiteVersionRow);
}

import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability";
import { createVersionAuditEntry, createVersionStatusAuditEntry } from "./audit";
import { clampVersionHistoryLimit, createWebsiteVersionId } from "./model";
import { createWebsiteVersionSnapshot } from "./snapshots";
import type { CreateWebsiteVersionParams, WebsiteVersionRecord, WebsiteVersionRow } from "./types";

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isInsertWebsiteVersionFunctionMissing(error: {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  hint?: unknown;
}): boolean {
  const code = readString(error.code);
  const searchable = [
    readString(error.message),
    readString(error.details),
    readString(error.hint),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    code === "PGRST202" ||
    code === "42883" ||
    (searchable.includes("insert_website_version") &&
      (searchable.includes("could not find the function") ||
        searchable.includes("does not exist")))
  );
}

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

async function createWebsiteVersionViaTableInsert(
  row: Omit<WebsiteVersionRow, "version_number" | "updated_at">,
): Promise<WebsiteVersionRecord> {
  const supabase = getSupabaseServiceClient();

  if (row.is_live) {
    const { error } = await supabase
      .from("website_versions")
      .update({
        is_live: false,
        status: "archived",
        updated_at: row.created_at,
      })
      .eq("structure_id", row.structure_id)
      .eq("is_live", true);

    if (error) {
      throw error;
    }
  }

  if (row.is_current_draft) {
    const { error } = await supabase
      .from("website_versions")
      .update({
        is_current_draft: false,
        status: "archived",
        updated_at: row.created_at,
      })
      .eq("structure_id", row.structure_id)
      .eq("is_current_draft", true);

    if (error) {
      throw error;
    }
  }

  const { data: existingVersions, error: existingError } = await supabase
    .from("website_versions")
    .select("version_number")
    .eq("structure_id", row.structure_id)
    .order("version_number", { ascending: false })
    .limit(1);

  if (existingError) {
    throw existingError;
  }

  const versionNumber =
    ((existingVersions?.[0] as { version_number?: number } | undefined)?.version_number ?? 0) + 1;
  const insertRow: WebsiteVersionRow = {
    ...row,
    version_number: versionNumber,
    updated_at: row.created_at,
  };

  const { data, error } = await supabase
    .from("website_versions")
    .insert(insertRow)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return fromRow(data as WebsiteVersionRow);
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
  const versionRowBase = {
    id: versionId,
    structure_id: params.structure.id,
    user_id: params.userId,
    label: params.label,
    status: params.status,
    source: params.source,
    structure_version: params.structure.version,
    snapshot: snapshotBundle.snapshot,
    fingerprint: snapshotBundle.fingerprint,
    summary: snapshotBundle.summary,
    deployment: params.deployment ?? null,
    comparison: params.comparison ?? null,
    is_live: params.status === "published",
    is_current_draft: true,
    restored_from_version_id: params.restoredFromVersionId ?? null,
    audit,
    created_at: createdAt,
  } satisfies Omit<WebsiteVersionRow, "version_number" | "updated_at">;

  const supabase = getSupabaseServiceClient();
  const { data, error } = await supabase.rpc("insert_website_version", {
    p_id: versionRowBase.id,
    p_structure_id: versionRowBase.structure_id,
    p_user_id: versionRowBase.user_id,
    p_label: versionRowBase.label,
    p_status: versionRowBase.status,
    p_source: versionRowBase.source,
    p_structure_version: versionRowBase.structure_version,
    p_is_live: versionRowBase.is_live,
    p_is_current_draft: true,
    p_snapshot: versionRowBase.snapshot,
    p_fingerprint: versionRowBase.fingerprint,
    p_summary: versionRowBase.summary,
    p_deployment: versionRowBase.deployment,
    p_comparison: versionRowBase.comparison,
    p_restored_from_version_id: versionRowBase.restored_from_version_id,
    p_audit: audit,
    p_created_at: createdAt,
  });

  if (error) {
    if (
      isInsertWebsiteVersionFunctionMissing({
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
    ) {
      return createWebsiteVersionViaTableInsert(versionRowBase);
    }

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

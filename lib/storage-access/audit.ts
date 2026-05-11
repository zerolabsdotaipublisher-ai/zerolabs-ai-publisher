import "server-only";

import { getSupabaseServiceClient } from "@/lib/supabase/server";
import { logger } from "@/lib/observability";
import { createStorageAccessAuditId } from "./model";
import type { StorageAccessAuditRecord } from "./types";

function shouldPersist(record: StorageAccessAuditRecord): boolean {
  if (!record.allowed) return true;
  if (record.actor.actorType === "service" || record.actor.actorType === "system") return true;
  return ["upload", "download", "signed_url", "replace", "delete", "manage"].includes(record.operation);
}

export async function auditStorageAccess(record: StorageAccessAuditRecord): Promise<void> {
  const level = record.allowed ? "info" : "warn";
  logger[level]("storage_access.decision", {
    category: record.allowed ? "request" : "security",
    service: "ai-publisher",
    operation: record.operation,
    actorType: record.actor.actorType,
    actorId: record.actor.userId,
    serviceRole: record.actor.serviceRole,
    resourceType: record.resourceType,
    resourceId: record.resourceId,
    ownerUserId: record.ownerUserId,
    tenantId: record.tenantId,
    allowed: record.allowed,
    code: record.code,
    reason: record.reason,
    ...record.metadata,
  });

  if (!shouldPersist(record)) {
    return;
  }

  try {
    const supabase = getSupabaseServiceClient();
    await supabase.from("storage_access_audit_logs").insert({
      id: createStorageAccessAuditId(),
      resource_type: record.resourceType,
      resource_id: record.resourceId ?? null,
      actor_type: record.actor.actorType,
      actor_id: record.actor.userId ?? null,
      service_role: record.actor.serviceRole ?? null,
      tenant_id: record.tenantId ?? null,
      owner_user_id: record.ownerUserId ?? null,
      operation: record.operation,
      allowed: record.allowed,
      denial_code: record.code ?? null,
      reason: record.reason ?? null,
      environment_stage: record.actor.environmentStage ?? null,
      metadata_json: record.metadata ?? {},
    });
  } catch (error) {
    logger.error("storage_access.audit.persist failed", {
      category: "error",
      service: "supabase",
      operation: record.operation,
      resourceType: record.resourceType,
      resourceId: record.resourceId,
      error: {
        name: "StorageAccessAuditError",
        message: error instanceof Error ? error.message : String(error),
      },
    });
  }
}

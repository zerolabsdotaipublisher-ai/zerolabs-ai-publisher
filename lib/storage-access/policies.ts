import "server-only";

import { createEmptyStoragePermissionMatrix, applyDecisionToMatrix } from "./model";
import { isPublicStorageOperation } from "./public-private";
import type {
  StorageAccessActorContext,
  StorageAccessDecision,
  StorageAccessOperation,
  StorageAccessResourceRecord,
  StorageClientPermissionMatrix,
  StorageResourceType,
  StorageServiceRole,
  StorageUploadTarget,
} from "./types";

const SERVICE_ROLE_RULES: Record<StorageServiceRole, Partial<Record<StorageResourceType, StorageAccessOperation[]>>> = {
  ai_generation_worker: {
    media: ["upload", "read", "preview", "signed_url", "update"],
    ai_asset: ["upload", "read", "preview", "signed_url", "update", "replace"],
  },
  publishing_worker: {
    media: ["read", "preview", "download", "signed_url"],
    ai_asset: ["read", "preview", "download", "signed_url"],
    website_media: ["read", "preview", "download", "signed_url"],
  },
  cleanup_job: {
    media: ["read", "delete", "manage"],
    file_upload: ["read", "delete", "manage"],
    ai_asset: ["read", "delete", "manage"],
    website_media: ["read", "delete", "manage"],
  },
  storage_processing: {
    media: ["upload", "read", "preview", "download", "signed_url", "update", "manage"],
    file_upload: ["upload", "read", "preview", "download", "signed_url", "update", "manage"],
    ai_asset: ["upload", "read", "preview", "download", "signed_url", "update", "replace", "manage"],
    website_media: ["upload", "read", "preview", "download", "signed_url", "update", "manage"],
  },
};

function allow(
  actor: StorageAccessActorContext,
  operation: StorageAccessOperation,
  resourceType: StorageResourceType,
  resourceId: string | undefined,
  reason?: string,
): StorageAccessDecision {
  return { allowed: true, actor, operation, resourceType, resourceId, reason };
}

function deny(
  actor: StorageAccessActorContext,
  operation: StorageAccessOperation,
  resourceType: StorageResourceType,
  resourceId: string | undefined,
  code: string,
  reason: string,
): StorageAccessDecision {
  return { allowed: false, actor, operation, resourceType, resourceId, code, reason };
}

function hasBlockingRole(actor: StorageAccessActorContext): boolean {
  return actor.roles.includes("suspended") || actor.roles.includes("blocked");
}

function isOwner(actor: StorageAccessActorContext, resource: StorageAccessResourceRecord): boolean {
  return actor.userId === resource.ownerUserId;
}

function sameTenant(actor: StorageAccessActorContext, tenantId: string): boolean {
  return !actor.tenantId || actor.tenantId === tenantId;
}

function serviceAllows(
  actor: StorageAccessActorContext,
  operation: StorageAccessOperation,
  resourceType: StorageResourceType,
): boolean {
  if (!actor.serviceRole) return false;
  const allowed = SERVICE_ROLE_RULES[actor.serviceRole]?.[resourceType] ?? [];
  return allowed.includes(operation);
}

export function evaluateStorageAccess(input: {
  actor: StorageAccessActorContext;
  operation: StorageAccessOperation;
  resource: StorageAccessResourceRecord;
}): StorageAccessDecision {
  const { actor, operation, resource } = input;

  if (resource.deletedAt && operation !== "manage") {
    return deny(actor, operation, resource.resourceType, resource.resourceId, "resource_deleted", "Storage resource is deleted.");
  }

  if (resource.objectKey && resource.namespacePrefix && !resource.objectKey.startsWith(resource.namespacePrefix)) {
    return deny(actor, operation, resource.resourceType, resource.resourceId, "namespace_scope_mismatch", "Storage namespace isolation check failed.");
  }

  if (resource.environmentStage && actor.environmentStage && resource.environmentStage !== actor.environmentStage) {
    return deny(actor, operation, resource.resourceType, resource.resourceId, "environment_scope_mismatch", "Storage resource belongs to a different environment scope.");
  }

  if (actor.actorType === "anonymous") {
    if (resource.visibility === "public" && isPublicStorageOperation(operation)) {
      return allow(actor, operation, resource.resourceType, resource.resourceId, "Published website asset access granted.");
    }
    return deny(actor, operation, resource.resourceType, resource.resourceId, "authentication_required", "Authentication is required for this storage operation.");
  }

  if (actor.actorType === "user") {
    if (hasBlockingRole(actor)) {
      return deny(actor, operation, resource.resourceType, resource.resourceId, "account_restricted", "Account does not have permission for this storage operation.");
    }

    if (!sameTenant(actor, resource.tenantId)) {
      return deny(actor, operation, resource.resourceType, resource.resourceId, "tenant_scope_mismatch", "Storage resource is outside the authenticated tenant scope.");
    }

    if (isOwner(actor, resource)) {
      return allow(actor, operation, resource.resourceType, resource.resourceId, "Owner access granted.");
    }

    if (resource.visibility === "public" && isPublicStorageOperation(operation)) {
      return allow(actor, operation, resource.resourceType, resource.resourceId, "Published website asset access granted.");
    }

    return deny(actor, operation, resource.resourceType, resource.resourceId, "ownership_required", "Storage resource is not owned by the authenticated user.");
  }

  if (!sameTenant(actor, resource.tenantId)) {
    return deny(actor, operation, resource.resourceType, resource.resourceId, "tenant_scope_mismatch", "Storage resource is outside the service tenant scope.");
  }

  if (serviceAllows(actor, operation, resource.resourceType)) {
    return allow(actor, operation, resource.resourceType, resource.resourceId, `Service role '${actor.serviceRole}' granted.`);
  }

  return deny(actor, operation, resource.resourceType, resource.resourceId, "service_role_forbidden", "Service role is not allowed to perform this storage operation.");
}

export function evaluateStorageUploadAccess(input: {
  actor: StorageAccessActorContext;
  target: StorageUploadTarget;
}): StorageAccessDecision {
  const { actor, target } = input;

  if (actor.actorType === "anonymous") {
    return deny(actor, "upload", target.resourceType, undefined, "authentication_required", "Authentication is required for uploads.");
  }

  if (actor.actorType === "user") {
    if (hasBlockingRole(actor)) {
      return deny(actor, "upload", target.resourceType, undefined, "account_restricted", "Account does not have permission to upload files.");
    }

    if (!sameTenant(actor, target.tenantId)) {
      return deny(actor, "upload", target.resourceType, undefined, "tenant_scope_mismatch", "Upload target is outside the authenticated tenant scope.");
    }

    return allow(actor, "upload", target.resourceType, undefined, "Upload allowed for authenticated owner.");
  }

  if (!sameTenant(actor, target.tenantId)) {
    return deny(actor, "upload", target.resourceType, undefined, "tenant_scope_mismatch", "Upload target is outside the service tenant scope.");
  }

  if (serviceAllows(actor, "upload", target.resourceType)) {
    return allow(actor, "upload", target.resourceType, undefined, `Service role '${actor.serviceRole}' granted.`);
  }

  return deny(actor, "upload", target.resourceType, undefined, "service_role_forbidden", "Service role is not allowed to upload files.");
}

export function buildStoragePermissionMatrix(
  actor: StorageAccessActorContext,
  resource: StorageAccessResourceRecord,
): StorageClientPermissionMatrix {
  const operations: StorageAccessOperation[] = [
    "upload",
    "read",
    "preview",
    "download",
    "signed_url",
    "update",
    "replace",
    "delete",
    "manage",
  ];

  return operations.reduce<StorageClientPermissionMatrix>((matrix, operation) => {
    const decision = evaluateStorageAccess({
      actor,
      operation,
      resource,
    });
    return applyDecisionToMatrix(matrix, decision);
  }, createEmptyStoragePermissionMatrix());
}

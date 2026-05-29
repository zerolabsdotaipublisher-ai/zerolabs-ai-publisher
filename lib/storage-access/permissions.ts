import "server-only";

import { auditStorageAccess } from "./audit";
import { StorageAccessDeniedError, StorageResourceNotFoundError } from "./errors";
import { resolveStorageResource } from "./ownership";
import { buildStoragePermissionMatrix, evaluateStorageAccess, evaluateStorageUploadAccess } from "./policies";
import type {
  StorageAccessActorContext,
  StorageAccessOperation,
  StorageClientPermissionMatrix,
  StorageResourceType,
  StorageUploadTarget,
} from "./types";

export async function assertStorageUploadPermission(
  actor: StorageAccessActorContext,
  target: StorageUploadTarget,
): Promise<void> {
  const decision = evaluateStorageUploadAccess({ actor, target });
  await auditStorageAccess({
    operation: "upload",
    actor,
    resourceType: target.resourceType,
    tenantId: target.tenantId,
    allowed: decision.allowed,
    reason: decision.reason,
    code: decision.code,
    metadata: {
      websiteId: target.websiteId,
      linkedContentId: target.linkedContentId,
      linkedContentType: target.linkedContentType,
    },
  });

  if (!decision.allowed) {
    throw new StorageAccessDeniedError(decision);
  }
}

export async function assertStorageResourcePermission(input: {
  actor: StorageAccessActorContext;
  operation: StorageAccessOperation;
  resourceType: StorageResourceType;
  resourceId: string;
  metadata?: Record<string, unknown>;
}) {
  const resource = await resolveStorageResource(input.resourceType, input.resourceId);
  if (!resource) {
    throw new StorageResourceNotFoundError(input.resourceType, input.resourceId);
  }

  const decision = evaluateStorageAccess({
    actor: input.actor,
    operation: input.operation,
    resource,
  });

  await auditStorageAccess({
    operation: input.operation,
    actor: input.actor,
    resourceType: resource.resourceType,
    resourceId: resource.resourceId,
    ownerUserId: resource.ownerUserId,
    tenantId: resource.tenantId,
    allowed: decision.allowed,
    reason: decision.reason,
    code: decision.code,
    metadata: input.metadata,
  });

  if (!decision.allowed) {
    throw new StorageAccessDeniedError(decision);
  }

  return resource;
}

export async function getStoragePermissionMatrix(input: {
  actor: StorageAccessActorContext;
  resourceType: StorageResourceType;
  resourceId: string;
}): Promise<{ resource: Awaited<ReturnType<typeof resolveStorageResource>>; permissions: StorageClientPermissionMatrix; }> {
  const resource = await resolveStorageResource(input.resourceType, input.resourceId);
  if (!resource) {
    throw new StorageResourceNotFoundError(input.resourceType, input.resourceId);
  }

  return {
    resource,
    permissions: buildStoragePermissionMatrix(input.actor, resource),
  };
}

import "server-only";

import { assertStorageResourcePermission, assertStorageUploadPermission, getStoragePermissionMatrix } from "./permissions";
import type { StorageAccessActorContext, StorageAccessOperation, StorageResourceType, StorageUploadTarget } from "./types";

export async function checkStorageAccess(input: {
  actor: StorageAccessActorContext;
  resourceType: StorageResourceType;
  operation: StorageAccessOperation;
  resourceId?: string;
  target?: StorageUploadTarget;
}) {
  if (input.operation === "upload") {
    if (!input.target) {
      throw new Error("Upload permission target is required.");
    }
    await assertStorageUploadPermission(input.actor, input.target);
    return { allowed: true };
  }

  if (!input.resourceId) {
    throw new Error("resourceId is required for this storage access check.");
  }

  await assertStorageResourcePermission({
    actor: input.actor,
    operation: input.operation,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
  });

  return { allowed: true };
}

export async function getStorageAccessPermissions(input: {
  actor: StorageAccessActorContext;
  resourceType: StorageResourceType;
  resourceId: string;
}) {
  return getStoragePermissionMatrix(input);
}

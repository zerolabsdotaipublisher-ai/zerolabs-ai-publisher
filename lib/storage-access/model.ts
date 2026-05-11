import type {
  StorageAccessDecision,
  StorageAccessOperation,
  StorageClientPermissionMatrix,
} from "./types";

export function createStorageAccessAuditId(): string {
  return `saudit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createEmptyStoragePermissionMatrix(): StorageClientPermissionMatrix {
  return {
    upload: false,
    read: false,
    preview: false,
    download: false,
    signedUrl: false,
    update: false,
    replace: false,
    delete: false,
    manage: false,
  };
}

export function storageOperationToPermissionKey(operation: StorageAccessOperation): keyof StorageClientPermissionMatrix {
  switch (operation) {
    case "signed_url":
      return "signedUrl";
    default:
      return operation;
  }
}

export function applyDecisionToMatrix(
  matrix: StorageClientPermissionMatrix,
  decision: StorageAccessDecision,
): StorageClientPermissionMatrix {
  return {
    ...matrix,
    [storageOperationToPermissionKey(decision.operation)]: decision.allowed,
  };
}

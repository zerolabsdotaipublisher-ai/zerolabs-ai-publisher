import type { User } from "@supabase/supabase-js";
import { getStorageRoles } from "@/lib/storage-access/rbac";

export interface AiAssetPermissionResult {
  allowed: boolean;
  roles: string[];
  reason?: string;
}

export function canManageOwnedAiAssets(user: User): AiAssetPermissionResult {
  const roles = getStorageRoles(user);
  if (roles.includes("suspended") || roles.includes("blocked")) {
    return {
      allowed: false,
      roles,
      reason: "Account does not have permission to manage AI assets.",
    };
  }

  return { allowed: true, roles };
}

export function canAccessAiAssetRecord(userId: string, recordOwnerId: string, tenantId?: string, recordTenantId?: string): AiAssetPermissionResult {
  if (userId !== recordOwnerId) {
    return {
      allowed: false,
      roles: [],
      reason: "AI asset record is not owned by the authenticated user.",
    };
  }

  if (tenantId && recordTenantId && tenantId !== recordTenantId) {
    return {
      allowed: false,
      roles: ["owner"],
      reason: "AI asset record is outside the authenticated tenant scope.",
    };
  }

  return {
    allowed: true,
    roles: ["owner"],
  };
}

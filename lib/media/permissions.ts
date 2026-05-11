import type { User } from "@supabase/supabase-js";
import { getStorageRoles } from "@/lib/storage-access/rbac";

export interface MediaPermissionResult {
  allowed: boolean;
  roles: string[];
  reason?: string;
}

export function canManageOwnedMedia(user: User): MediaPermissionResult {
  const roles = getStorageRoles(user);
  if (roles.includes("suspended") || roles.includes("blocked")) {
    return {
      allowed: false,
      roles,
      reason: "Account does not have permission to manage media.",
    };
  }

  return {
    allowed: true,
    roles,
  };
}

export function canAccessMediaRecord(userId: string, recordOwnerId: string, tenantId?: string, recordTenantId?: string): MediaPermissionResult {
  if (userId !== recordOwnerId) {
    return {
      allowed: false,
      roles: [],
      reason: "Media record is not owned by the authenticated user.",
    };
  }

  if (tenantId && recordTenantId && tenantId !== recordTenantId) {
    return {
      allowed: false,
      roles: ["owner"],
      reason: "Media record is outside the authenticated tenant scope.",
    };
  }

  return {
    allowed: true,
    roles: ["owner"],
  };
}

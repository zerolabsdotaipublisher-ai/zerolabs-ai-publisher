import type { User } from "@supabase/supabase-js";
import { canManageOwnedMedia } from "@/lib/media/permissions";

export interface WebsiteMediaLibraryPermissionResult {
  allowed: boolean;
  reason?: string;
}

export function canManageWebsiteMediaLibrary(user: User): WebsiteMediaLibraryPermissionResult {
  const permission = canManageOwnedMedia(user);
  return {
    allowed: permission.allowed,
    reason: permission.reason,
  };
}

export function canAccessWebsiteMediaLibraryRecord(userId: string, recordOwnerId: string, tenantId: string, recordTenantId: string): WebsiteMediaLibraryPermissionResult {
  if (userId !== recordOwnerId) {
    return {
      allowed: false,
      reason: "Website media library record is not owned by the authenticated user.",
    };
  }

  if (tenantId !== recordTenantId) {
    return {
      allowed: false,
      reason: "Website media library record is outside the authenticated tenant scope.",
    };
  }

  return { allowed: true };
}

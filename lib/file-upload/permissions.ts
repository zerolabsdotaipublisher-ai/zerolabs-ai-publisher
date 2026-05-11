import type { User } from "@supabase/supabase-js";
import { canAccessMediaRecord, canManageOwnedMedia, type MediaPermissionResult } from "@/lib/media/permissions";

export type FileUploadPermissionResult = MediaPermissionResult;

export function canManageOwnedFileUploads(user: User): FileUploadPermissionResult {
  return canManageOwnedMedia(user);
}

export function canAccessOwnedFileUploadRecord(userId: string, ownerId: string, tenantId?: string, recordTenantId?: string): FileUploadPermissionResult {
  return canAccessMediaRecord(userId, ownerId, tenantId, recordTenantId);
}

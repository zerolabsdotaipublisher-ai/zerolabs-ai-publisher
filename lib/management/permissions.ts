import type { WebsiteStructure } from "@/lib/ai/structure";
import type { WebsiteManagementRecord } from "./types";

export interface WebsiteControlPermissions {
  canManage: boolean;
  canPreview: boolean;
  canEdit: boolean;
  canOpenSettings: boolean;
  canRename: boolean;
  canDelete: boolean;
  canArchive: boolean;
  canActivate: boolean;
  canPublish: boolean;
  canPublishUpdates: boolean;
  canDuplicate: boolean;
}

function isArchived(record: WebsiteManagementRecord): boolean {
  return record.structureStatus === "archived";
}

function isDeleted(record: WebsiteManagementRecord): boolean {
  return record.deletionState === "deleted" || record.status === "deleted";
}

export function canMutateWebsite(structure: WebsiteStructure, userId: string): boolean {
  return structure.userId === userId && !structure.management?.deletedAt;
}

export function canDeleteWebsite(structure: WebsiteStructure, userId: string): boolean {
  return structure.userId === userId && !structure.management?.deletedAt;
}

export function canRenameWebsite(structure: WebsiteStructure, userId: string): boolean {
  return structure.userId === userId && !structure.management?.deletedAt;
}

export function deriveWebsiteControlPermissions(
  record: WebsiteManagementRecord,
  options: { currentUserId?: string } = {},
): WebsiteControlPermissions {
  const isOwner = options.currentUserId ? record.userId === options.currentUserId : true;
  const deleted = isDeleted(record);
  const archived = isArchived(record);

  const canAccessCoreRoutes = isOwner && !deleted;

  return {
    canManage: canAccessCoreRoutes,
    canPreview: canAccessCoreRoutes,
    canEdit: canAccessCoreRoutes,
    canOpenSettings: canAccessCoreRoutes,
    canRename: canAccessCoreRoutes,
    canDelete: isOwner && !deleted,
    canArchive: canAccessCoreRoutes && !archived,
    canActivate: canAccessCoreRoutes && archived,
    canPublish: canAccessCoreRoutes && !archived,
    canPublishUpdates: canAccessCoreRoutes && !archived,
    canDuplicate: false,
  };
}

export const STORAGE_RESOURCE_TYPES = ["media", "file_upload", "ai_asset", "website_media"] as const;
export type StorageResourceType = (typeof STORAGE_RESOURCE_TYPES)[number];

export const STORAGE_ACCESS_OPERATIONS = [
  "upload",
  "read",
  "preview",
  "download",
  "signed_url",
  "update",
  "replace",
  "delete",
  "manage",
] as const;
export type StorageAccessOperation = (typeof STORAGE_ACCESS_OPERATIONS)[number];

export const STORAGE_SERVICE_ROLES = [
  "ai_generation_worker",
  "publishing_worker",
  "cleanup_job",
  "storage_processing",
] as const;
export type StorageServiceRole = (typeof STORAGE_SERVICE_ROLES)[number];

export type StorageActorType = "anonymous" | "user" | "service" | "system";
export type StorageVisibility = "private" | "protected" | "public";

export interface StorageAccessActorContext {
  actorType: StorageActorType;
  userId?: string;
  tenantId?: string;
  roles: string[];
  serviceRole?: StorageServiceRole;
  environmentStage?: string;
}

export interface StorageAccessResourceRecord {
  resourceType: StorageResourceType;
  resourceId: string;
  ownerUserId: string;
  tenantId: string;
  mediaId?: string;
  websiteId?: string;
  linkedContentId?: string;
  linkedContentType?: string;
  status?: string;
  visibility: StorageVisibility;
  deletedAt?: string;
  metadata: Record<string, unknown>;
  objectKey?: string;
  namespacePrefix?: string;
  environmentStage?: string;
}

export interface StorageClientPermissionMatrix {
  upload: boolean;
  read: boolean;
  preview: boolean;
  download: boolean;
  signedUrl: boolean;
  update: boolean;
  replace: boolean;
  delete: boolean;
  manage: boolean;
}

export interface StorageAccessDecision {
  allowed: boolean;
  operation: StorageAccessOperation;
  actor: StorageAccessActorContext;
  resourceType: StorageResourceType;
  resourceId?: string;
  reason?: string;
  code?: string;
}

export interface StorageUploadTarget {
  resourceType: StorageResourceType;
  tenantId: string;
  websiteId?: string;
  linkedContentId?: string;
  linkedContentType?: string;
  metadata?: Record<string, unknown>;
}

export interface StorageAccessAuditRecord {
  operation: StorageAccessOperation;
  actor: StorageAccessActorContext;
  resourceType: StorageResourceType;
  resourceId?: string;
  ownerUserId?: string;
  tenantId?: string;
  allowed: boolean;
  reason?: string;
  code?: string;
  metadata?: Record<string, unknown>;
}

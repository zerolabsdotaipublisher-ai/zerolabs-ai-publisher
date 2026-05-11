import type { StorageAccessOperation, StorageResourceType, StorageServiceRole } from "./types";

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function parseStorageResourceType(value: unknown): StorageResourceType | undefined {
  const normalized = asString(value);
  if (normalized === "media" || normalized === "file_upload" || normalized === "ai_asset" || normalized === "website_media") {
    return normalized;
  }
  return undefined;
}

export function parseStorageOperation(value: unknown): StorageAccessOperation | undefined {
  const normalized = asString(value);
  if (
    normalized === "upload" ||
    normalized === "read" ||
    normalized === "preview" ||
    normalized === "download" ||
    normalized === "signed_url" ||
    normalized === "update" ||
    normalized === "replace" ||
    normalized === "delete" ||
    normalized === "manage"
  ) {
    return normalized;
  }
  return undefined;
}

export function parseStorageServiceRole(value: string | null): StorageServiceRole | undefined {
  if (
    value === "ai_generation_worker" ||
    value === "publishing_worker" ||
    value === "cleanup_job" ||
    value === "storage_processing"
  ) {
    return value;
  }
  return undefined;
}

export async function parseStorageAccessCheckBody(request: Request): Promise<{
  resourceType?: StorageResourceType;
  resourceId?: string;
  operation?: StorageAccessOperation;
  tenantId?: string;
  websiteId?: string;
  linkedContentId?: string;
  linkedContentType?: string;
}> {
  const body = await request.json() as Record<string, unknown>;
  return {
    resourceType: parseStorageResourceType(body.resourceType),
    resourceId: asString(body.resourceId),
    operation: parseStorageOperation(body.operation),
    tenantId: asString(body.tenantId),
    websiteId: asString(body.websiteId),
    linkedContentId: asString(body.linkedContentId),
    linkedContentType: asString(body.linkedContentType),
  };
}

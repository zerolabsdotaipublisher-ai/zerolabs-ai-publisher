import "server-only";

import {
  assertStorageResourcePermission,
  createAnonymousStorageActor,
  createResourceUserStorageActor,
  type StorageAccessActorContext,
} from "@/lib/storage-access";
import { StorageAccessError } from "@/lib/storage-access/errors";
import { resolveSharedPreviewAccess, type SharedPreviewAccess } from "@/lib/preview/security";
import type { WebsiteAssetRecord } from "./types";

export interface WebsiteAssetAuthorization {
  actor: StorageAccessActorContext;
  previewAccess?: SharedPreviewAccess;
}

function assetBelongsToPreview(record: WebsiteAssetRecord, previewAccess: SharedPreviewAccess): boolean {
  const websiteId = record.association.websiteId ?? record.libraryItem.websiteId;
  return Boolean(
    websiteId
    && websiteId === previewAccess.structure.id
    && record.libraryItem.userId === previewAccess.structure.userId,
  );
}

export async function authorizeWebsiteAssetAccess(input: {
  asset: WebsiteAssetRecord;
  userId?: string;
  previewToken?: string;
  operation: "read" | "preview" | "download" | "signed_url";
}): Promise<WebsiteAssetAuthorization> {
  if (input.userId) {
    const actor = createResourceUserStorageActor(input.userId);
    await assertStorageResourcePermission({
      actor,
      operation: input.operation,
      resourceType: "website_media",
      resourceId: input.asset.id,
      metadata: {
        websiteId: input.asset.association.websiteId,
        pageId: input.asset.association.pageId,
        sectionId: input.asset.association.sectionId,
      },
    });
    return { actor };
  }

  if (input.previewToken) {
    const previewAccess = await resolveSharedPreviewAccess(input.previewToken);
    if (!previewAccess) {
      throw new StorageAccessError("Invalid or expired preview token.", 404, "preview_token_not_found");
    }
    if (!assetBelongsToPreview(input.asset, previewAccess)) {
      throw new StorageAccessError("Preview token cannot access this website asset.", 403, "preview_token_scope_mismatch", {
        assetId: input.asset.id,
        websiteId: input.asset.association.websiteId ?? input.asset.libraryItem.websiteId,
      });
    }
    return {
      actor: createAnonymousStorageActor(),
      previewAccess,
    };
  }

  const actor = createAnonymousStorageActor();
  await assertStorageResourcePermission({
    actor,
    operation: input.operation,
    resourceType: "website_media",
    resourceId: input.asset.id,
  });
  return { actor };
}

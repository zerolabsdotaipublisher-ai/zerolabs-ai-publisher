import "server-only";

import {
  assertStorageResourcePermission,
  createAnonymousStorageActor,
  createResourceUserStorageActor,
  type StorageAccessActorContext,
} from "@/lib/storage-access";
import { StorageAccessError } from "@/lib/storage-access/errors";
import { canViewFeedSharedWebsiteDesign } from "@/lib/feed/shared-website-access";
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

function assetBelongsToWebsite(record: WebsiteAssetRecord, websiteId: string): boolean {
  return Boolean(
    websiteId
    && (record.association.websiteId ?? record.libraryItem.websiteId) === websiteId,
  );
}

export async function authorizeWebsiteAssetAccess(input: {
  asset: WebsiteAssetRecord;
  userId?: string;
  previewToken?: string;
  feedSharedWebsiteId?: string;
  operation: "read" | "preview" | "download" | "signed_url";
}): Promise<WebsiteAssetAuthorization> {
  if (input.userId && input.feedSharedWebsiteId) {
    const websiteId = input.feedSharedWebsiteId.trim();
    if (!assetBelongsToWebsite(input.asset, websiteId)) {
      throw new StorageAccessError("Feed share cannot access this website asset.", 403, "feed_shared_website_asset_scope_mismatch", {
        assetId: input.asset.id,
        websiteId: input.asset.association.websiteId ?? input.asset.libraryItem.websiteId,
      });
    }
    if (!await canViewFeedSharedWebsiteDesign(websiteId)) {
      throw new StorageAccessError("This shared website is no longer available.", 404, "feed_shared_website_not_available", {
        websiteId,
      });
    }
    return { actor: createResourceUserStorageActor(input.asset.libraryItem.userId) };
  }

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

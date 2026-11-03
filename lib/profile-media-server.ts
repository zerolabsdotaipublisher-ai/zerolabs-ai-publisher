import "server-only";

import { createOwnedMediaSignedUrl, uploadOwnedMedia } from "@/lib/media/workflow";
import { getOwnedMediaAsset } from "@/lib/media/storage";
import type { MediaAsset } from "@/lib/media/types";
import {
  PROFILE_MEDIA_MAX_BYTES,
  PROFILE_MEDIA_MIME_TYPES,
  isProfileMediaReference,
  isSupportedProfileMediaUrl,
  parseProfileMediaReference,
  toProfileMediaReference,
  validateProfileMediaUpload,
  type ProfileMediaDisplayUrls,
  type ProfileMediaKind,
} from "./profile-media";

export class ProfileMediaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProfileMediaError";
  }
}

function isExpectedProfileMediaAsset(asset: MediaAsset, kind: ProfileMediaKind): boolean {
  return (
    asset.mediaType === "image" &&
    asset.fileSizeBytes > 0 &&
    asset.fileSizeBytes <= PROFILE_MEDIA_MAX_BYTES &&
    (PROFILE_MEDIA_MIME_TYPES as readonly string[]).includes(asset.mimeType) &&
    asset.metadata.profileMediaKind === kind &&
    asset.metadata.profileMediaOwnerId === asset.userId
  );
}

export async function uploadProfileMedia(input: {
  userId: string;
  kind: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  bytes: Uint8Array;
}) {
  const validation = validateProfileMediaUpload(input);
  if (!validation.ok || !validation.normalized) {
    throw new ProfileMediaError(validation.errors[0] ?? "The selected image could not be uploaded.");
  }

  const uploaded = await uploadOwnedMedia({
    userId: input.userId,
    // The user ID is derived from the authenticated server session, never form data.
    tenantId: input.userId,
    fileName: validation.normalized.storageFileName,
    mimeType: validation.normalized.mimeType,
    fileSizeBytes: input.fileSizeBytes,
    bytes: input.bytes,
    mediaType: "image",
    linkedContentId: input.userId,
    linkedContentType: "profile",
    usageContext: "asset",
    metadata: {
      source: "profile_media",
      profileMediaKind: validation.normalized.kind,
      profileMediaOwnerId: input.userId,
    },
  });

  return {
    reference: toProfileMediaReference(uploaded.media.id),
    previewUrl: uploaded.signed.url,
    expiresAt: uploaded.signed.expiresAt,
    fileName: input.fileName.trim(),
  };
}

/** Ensures a canonical reference belongs to the current user and to this profile-media slot. */
export async function assertOwnedProfileMediaReference(input: {
  userId: string;
  reference: string;
  kind: ProfileMediaKind;
}): Promise<void> {
  const mediaId = parseProfileMediaReference(input.reference);
  if (!mediaId) {
    throw new ProfileMediaError("The selected profile media reference is invalid.");
  }

  const media = await getOwnedMediaAsset(input.userId, mediaId);
  if (!media || !isExpectedProfileMediaAsset(media, input.kind)) {
    throw new ProfileMediaError("Choose profile media uploaded to this account.");
  }
}

export async function resolveProfileMediaDisplayUrl(input: {
  userId: string;
  reference: string | null | undefined;
  kind: ProfileMediaKind;
}): Promise<string | null> {
  if (!input.reference) return null;
  if (!isProfileMediaReference(input.reference)) {
    return isSupportedProfileMediaUrl(input.reference) ? input.reference : null;
  }

  try {
    await assertOwnedProfileMediaReference({
      userId: input.userId,
      reference: input.reference,
      kind: input.kind,
    });
    const mediaId = parseProfileMediaReference(input.reference);
    if (!mediaId) return null;
    const signed = await createOwnedMediaSignedUrl({ userId: input.userId, mediaId });
    return signed.url;
  } catch {
    // A missing, deleted, or unauthorized object should degrade to initials/gradient.
    return null;
  }
}

export async function resolveProfileMediaDisplayUrls(input: {
  userId: string;
  avatarReference: string | null | undefined;
  coverReference: string | null | undefined;
}): Promise<ProfileMediaDisplayUrls> {
  const [avatarUrl, coverUrl] = await Promise.all([
    resolveProfileMediaDisplayUrl({ userId: input.userId, reference: input.avatarReference, kind: "avatar" }),
    resolveProfileMediaDisplayUrl({ userId: input.userId, reference: input.coverReference, kind: "cover" }),
  ]);

  return { avatarUrl, coverUrl };
}

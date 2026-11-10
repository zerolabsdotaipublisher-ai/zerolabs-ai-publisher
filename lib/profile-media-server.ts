import "server-only";

import { randomUUID } from "crypto";
import {
  PROFILE_MEDIA_BUCKET,
  PROFILE_MEDIA_MAX_BYTES,
  PROFILE_MEDIA_MIME_TYPES,
  createProfileMediaObjectPath,
  isLegacyProfileMediaReference,
  isProfileMediaReference,
  isSupportedProfileMediaUrl,
  parseProfileMediaObjectPath,
  parseProfileMediaReference,
  toProfileMediaReference,
  validateProfileMediaUpload,
  type ProfileMediaDisplayUrls,
  type ProfileMediaKind,
} from "./profile-media";
import { SupabaseServiceRoleError, getSupabaseServiceClient } from "./supabase/server";

const PROFILE_MEDIA_SIGNED_URL_SECONDS = 5 * 60;

export const PROFILE_MEDIA_ERROR_CODES = [
  "INVALID_MEDIA_KIND",
  "INVALID_MIME_TYPE",
  "FILE_TOO_LARGE",
  "INVALID_IMAGE",
  "STORAGE_NOT_CONFIGURED",
  "STORAGE_UPLOAD_FAILED",
  "SIGNED_URL_GENERATION_FAILED",
  "DURABLE_REFERENCE_GENERATION_FAILED",
  "OWNERSHIP_CHECK_FAILED",
  "STORAGE_DELETE_FAILED",
  "PROFILE_MEDIA_UPLOAD_FAILED",
] as const;

export type ProfileMediaErrorCode = (typeof PROFILE_MEDIA_ERROR_CODES)[number];

export class ProfileMediaError extends Error {
  constructor(
    message: string,
    readonly code: ProfileMediaErrorCode = "INVALID_IMAGE",
    readonly status = 400,
  ) {
    super(message);
    this.name = "ProfileMediaError";
  }
}

function profileMediaValidationError(input: {
  kind: string;
  mimeType: string;
  fileSizeBytes: number;
}, fallbackMessage: string): ProfileMediaError {
  const mimeType = input.mimeType.trim().toLowerCase();
  const kind = input.kind.trim().toLowerCase();

  if (kind !== "avatar" && kind !== "cover" && kind !== "background") return new ProfileMediaError(fallbackMessage, "INVALID_MEDIA_KIND");
  if (!(PROFILE_MEDIA_MIME_TYPES as readonly string[]).includes(mimeType)) return new ProfileMediaError(fallbackMessage, "INVALID_MIME_TYPE");
  if (!Number.isFinite(input.fileSizeBytes) || input.fileSizeBytes < 1 || input.fileSizeBytes > PROFILE_MEDIA_MAX_BYTES) {
    return new ProfileMediaError(fallbackMessage, "FILE_TOO_LARGE");
  }
  return new ProfileMediaError(fallbackMessage, "INVALID_IMAGE");
}

function storageConfigurationError(error: unknown): ProfileMediaError | null {
  if (error instanceof SupabaseServiceRoleError) {
    return new ProfileMediaError(
      "Profile image storage is temporarily unavailable. Your selection is still ready to retry.",
      "STORAGE_NOT_CONFIGURED",
      503,
    );
  }
  return null;
}

function assertReferenceOwnership(input: { userId: string; reference: string; kind: ProfileMediaKind }): string {
  const objectPath = parseProfileMediaReference(input.reference);
  const parsedPath = parseProfileMediaObjectPath(objectPath);
  const ownerPathSegment = encodeURIComponent(input.userId);

  if (!objectPath || !parsedPath || parsedPath.ownerPathSegment !== ownerPathSegment || parsedPath.kind !== input.kind) {
    throw new ProfileMediaError("Choose profile media uploaded to this account.", "OWNERSHIP_CHECK_FAILED", 403);
  }

  return objectPath;
}

/**
 * The service-role client is used only after the route authenticated the caller.
 * The object key is generated here from that caller's user ID, and every later
 * read/delete re-checks the same user-scoped prefix before bypassing Storage RLS.
 */
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
    throw profileMediaValidationError(input, validation.errors[0] ?? "The selected image could not be uploaded.");
  }

  let objectPath: string;
  let reference: string;
  try {
    objectPath = createProfileMediaObjectPath({
      userId: input.userId,
      kind: validation.normalized.kind,
      generatedFileToken: randomUUID(),
      mimeType: validation.normalized.mimeType,
    });
    reference = toProfileMediaReference(objectPath);
  } catch {
    throw new ProfileMediaError(
      "The uploaded image could not be prepared for saving. Your selection is still ready to retry.",
      "DURABLE_REFERENCE_GENERATION_FAILED",
      500,
    );
  }

  let storage;
  try {
    storage = getSupabaseServiceClient().storage.from(PROFILE_MEDIA_BUCKET);
  } catch (error) {
    throw storageConfigurationError(error) ?? new ProfileMediaError(
      "Profile image storage is temporarily unavailable. Your selection is still ready to retry.",
      "STORAGE_NOT_CONFIGURED",
      503,
    );
  }

  let uploadError: unknown;
  try {
    ({ error: uploadError } = await storage.upload(objectPath, input.bytes, {
      contentType: validation.normalized.mimeType,
      cacheControl: "3600",
      upsert: false,
    }));
  } catch {
    uploadError = new Error("Supabase Storage upload failed.");
  }
  if (uploadError) {
    throw new ProfileMediaError(
      "We couldn't write that image to profile storage. Your selection is still ready to retry.",
      "STORAGE_UPLOAD_FAILED",
      502,
    );
  }

  let signed: { signedUrl?: string } | null = null;
  let signedUrlError: unknown;
  try {
    ({ data: signed, error: signedUrlError } = await storage.createSignedUrl(objectPath, PROFILE_MEDIA_SIGNED_URL_SECONDS));
  } catch {
    signedUrlError = new Error("Supabase Storage signing failed.");
  }
  if (signedUrlError || !signed?.signedUrl) {
    // Nothing references this object yet, so a failed response can be retried
    // without retaining an unusable object whenever cleanup succeeds.
    await storage.remove([objectPath]).catch(() => undefined);
    throw new ProfileMediaError(
      "The image was stored but could not be prepared for display. Your selection is still ready to retry.",
      "SIGNED_URL_GENERATION_FAILED",
      502,
    );
  }

  return {
    reference,
    previewUrl: signed.signedUrl,
    expiresAt: new Date(Date.now() + PROFILE_MEDIA_SIGNED_URL_SECONDS * 1000).toISOString(),
    fileName: input.fileName.trim(),
  };
}

/** Ensures a current Supabase reference belongs to the current user and requested profile-media slot. */
export async function assertOwnedProfileMediaReference(input: {
  userId: string;
  reference: string;
  kind: ProfileMediaKind;
}): Promise<void> {
  assertReferenceOwnership(input);
}

export async function deleteOwnedProfileMediaReference(input: {
  userId: string;
  reference: string;
  kind: ProfileMediaKind;
}): Promise<void> {
  const objectPath = assertReferenceOwnership(input);

  let storage;
  try {
    storage = getSupabaseServiceClient().storage.from(PROFILE_MEDIA_BUCKET);
  } catch (error) {
    throw storageConfigurationError(error) ?? new ProfileMediaError("Profile image storage is temporarily unavailable.", "STORAGE_NOT_CONFIGURED", 503);
  }

  const { error } = await storage.remove([objectPath]);
  if (error) {
    throw new ProfileMediaError("The previous profile image could not be removed.", "STORAGE_DELETE_FAILED", 502);
  }
}

export async function resolveProfileMediaDisplayUrl(input: {
  userId: string;
  reference: string | null | undefined;
  kind: ProfileMediaKind;
}): Promise<string | null> {
  if (!input.reference) return null;

  // HTTP(S) media remains supported for existing profiles. Old `media:` values
  // deliberately do not call the retired profile-media backend; they fall back to
  // initials/gradient until an owner replaces them.
  if (!isProfileMediaReference(input.reference)) {
    return isLegacyProfileMediaReference(input.reference) || !isSupportedProfileMediaUrl(input.reference)
      ? null
      : input.reference;
  }

  try {
    const objectPath = assertReferenceOwnership({
      userId: input.userId,
      reference: input.reference,
      kind: input.kind,
    });
    const storage = getSupabaseServiceClient().storage.from(PROFILE_MEDIA_BUCKET);
    const { data, error } = await storage.createSignedUrl(objectPath, PROFILE_MEDIA_SIGNED_URL_SECONDS);
    return error || !data?.signedUrl ? null : data.signedUrl;
  } catch {
    // A missing, deleted, malformed, or unauthorized object degrades safely.
    return null;
  }
}

export async function resolveProfileMediaDisplayUrls(input: {
  userId: string;
  avatarReference: string | null | undefined;
  coverReference: string | null | undefined;
  backgroundReference?: string | null | undefined;
}): Promise<ProfileMediaDisplayUrls> {
  const [avatarUrl, coverUrl, backgroundUrl] = await Promise.all([
    resolveProfileMediaDisplayUrl({ userId: input.userId, reference: input.avatarReference, kind: "avatar" }),
    resolveProfileMediaDisplayUrl({ userId: input.userId, reference: input.coverReference, kind: "cover" }),
    resolveProfileMediaDisplayUrl({ userId: input.userId, reference: input.backgroundReference, kind: "background" }),
  ]);

  return { avatarUrl, coverUrl, backgroundUrl };
}

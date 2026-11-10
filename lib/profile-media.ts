export const PROFILE_MEDIA_KINDS = ["avatar", "cover", "background"] as const;
export const PROFILE_MEDIA_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
// Keep the file payload below Vercel's 4.5 MB Function request envelope once
// multipart metadata is included.
export const PROFILE_MEDIA_MAX_BYTES = 4 * 1024 * 1024;
export const PROFILE_MEDIA_BUCKET = "profile-media";
export const PROFILE_MEDIA_REFERENCE_PREFIX = `supabase:${PROFILE_MEDIA_BUCKET}:`;
export const LEGACY_PROFILE_MEDIA_REFERENCE_PREFIX = "media:";

export type ProfileMediaKind = (typeof PROFILE_MEDIA_KINDS)[number];

export type ProfileMediaDisplayUrls = {
  avatarUrl: string | null;
  coverUrl: string | null;
  /** Optional so callers with an older avatar/cover-only payload remain compatible. */
  backgroundUrl?: string | null;
};

type ProfileMediaUploadInput = {
  kind: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  bytes?: Uint8Array;
};

type ProfileMediaUploadValidation = {
  ok: boolean;
  errors: string[];
  normalized?: {
    kind: ProfileMediaKind;
    mimeType: (typeof PROFILE_MEDIA_MIME_TYPES)[number];
    storageFileName: string;
  };
};

const MAX_SOURCE_FILENAME_LENGTH = 200;
const MAX_PROFILE_MEDIA_REFERENCE_LENGTH = 2048;
const LEGACY_MEDIA_ID_PATTERN = /^media_[a-z0-9_]+$/i;
const PROFILE_MEDIA_OBJECT_PATH_PATTERN = /^([A-Za-z0-9_.%~-]+)\/(avatar|cover|background)\/profile-(avatar|cover|background)-([a-z0-9-]+)\.(jpg|png|webp|gif)$/i;

// Source names are never used as object keys: uploads use a generated
// profile-avatar or profile-cover filename. Only reject values that cannot be
// a single safe filename component, rather than rejecting normal punctuation
// added by browsers, cameras, and download tools.
function isSafeSourceFilename(fileName: string): boolean {
  return (
    fileName.length > 0 &&
    fileName.length <= MAX_SOURCE_FILENAME_LENGTH &&
    fileName !== "." &&
    fileName !== ".." &&
    !/[\\/\u0000-\u001f]/.test(fileName)
  );
}

const FILE_EXTENSION_BY_MIME_TYPE: Record<(typeof PROFILE_MEDIA_MIME_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function isProfileMediaKind(value: string): value is ProfileMediaKind {
  return (PROFILE_MEDIA_KINDS as readonly string[]).includes(value);
}

function isProfileMediaMimeType(value: string): value is (typeof PROFILE_MEDIA_MIME_TYPES)[number] {
  return (PROFILE_MEDIA_MIME_TYPES as readonly string[]).includes(value);
}

function bytesMatch(bytes: Uint8Array, expected: number[]): boolean {
  return expected.every((value, index) => bytes[index] === value);
}

/** Identifies only the image formats supported by profile media uploads. */
export function detectProfileMediaMimeType(bytes: Uint8Array): (typeof PROFILE_MEDIA_MIME_TYPES)[number] | null {
  if (bytes.length >= 3 && bytesMatch(bytes, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (bytes.length >= 8 && bytesMatch(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png";
  if (bytes.length >= 12 && bytesMatch(bytes, [0x52, 0x49, 0x46, 0x46]) && bytesMatch(bytes.slice(8), [0x57, 0x45, 0x42, 0x50])) {
    return "image/webp";
  }
  if (bytes.length >= 6 && (bytesMatch(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61]) || bytesMatch(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))) {
    return "image/gif";
  }
  return null;
}

export function createProfileMediaObjectPath(input: {
  userId: string;
  kind: ProfileMediaKind;
  generatedFileToken: string;
  mimeType: (typeof PROFILE_MEDIA_MIME_TYPES)[number];
}): string {
  const userPathSegment = encodeURIComponent(input.userId);
  const extension = FILE_EXTENSION_BY_MIME_TYPE[input.mimeType];
  const objectPath = `${userPathSegment}/${input.kind}/profile-${input.kind}-${input.generatedFileToken}.${extension}`;

  if (!parseProfileMediaObjectPath(objectPath)) {
    throw new Error("Invalid generated profile-media object path.");
  }

  return objectPath;
}

export function parseProfileMediaObjectPath(value: string | null | undefined): {
  ownerPathSegment: string;
  kind: ProfileMediaKind;
  fileName: string;
} | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_PROFILE_MEDIA_REFERENCE_LENGTH) return null;
  const match = PROFILE_MEDIA_OBJECT_PATH_PATTERN.exec(value);
  if (!match) return null;

  const [, ownerPathSegment, directoryKind, fileKind, token, extension] = match;
  if (directoryKind !== fileKind || !isProfileMediaKind(directoryKind)) return null;

  return {
    ownerPathSegment,
    kind: directoryKind,
    fileName: `profile-${fileKind}-${token}.${extension.toLowerCase()}`,
  };
}

export function toProfileMediaReference(objectPath: string): string {
  if (!parseProfileMediaObjectPath(objectPath)) {
    throw new Error("Invalid profile-media object path.");
  }
  return `${PROFILE_MEDIA_REFERENCE_PREFIX}${objectPath}`;
}

/** Parses current Supabase Storage references only. */
export function parseProfileMediaReference(value: string | null | undefined): string | null {
  if (typeof value !== "string" || !value.startsWith(PROFILE_MEDIA_REFERENCE_PREFIX)) return null;
  const objectPath = value.slice(PROFILE_MEDIA_REFERENCE_PREFIX.length);
  return parseProfileMediaObjectPath(objectPath) ? objectPath : null;
}

export function isProfileMediaReference(value: string | null | undefined): value is string {
  return parseProfileMediaReference(value) !== null;
}

/** Old media records were stored by the prior profile-media backend. Keep them readable but never upload new ones. */
export function isLegacyProfileMediaReference(value: string | null | undefined): value is string {
  if (typeof value !== "string" || !value.startsWith(LEGACY_PROFILE_MEDIA_REFERENCE_PREFIX)) return false;
  return LEGACY_MEDIA_ID_PATTERN.test(value.slice(LEGACY_PROFILE_MEDIA_REFERENCE_PREFIX.length));
}

export function isSupportedProfileMediaUrl(value: string | null | undefined): boolean {
  if (isProfileMediaReference(value) || isLegacyProfileMediaReference(value)) return true;
  if (!value) return value === null || value === undefined;

  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/** Signed URLs are display-only transport values and must never be canonical profile data. */
export function isSupabaseProfileMediaSignedUrl(value: string | null | undefined): boolean {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.pathname.includes(`/storage/v1/object/sign/${PROFILE_MEDIA_BUCKET}/`) &&
      url.searchParams.has("token")
    );
  } catch {
    return false;
  }
}

/** Client validation intentionally mirrors the server's type, size, and filename checks. */
export function validateProfileMediaUpload(input: ProfileMediaUploadInput): ProfileMediaUploadValidation {
  const errors: string[] = [];
  const kind = input.kind.trim().toLowerCase();
  const mimeType = input.mimeType.trim().toLowerCase();
  const fileName = input.fileName.trim();

  if (!isProfileMediaKind(kind)) errors.push("Choose whether this image is a profile picture, cover photo, or page background.");
  if (!isProfileMediaMimeType(mimeType)) errors.push("Choose a JPG, PNG, WebP, or GIF image.");
  if (!fileName || fileName !== input.fileName || !isSafeSourceFilename(fileName)) {
    errors.push("Choose an image with a safe filename.");
  }
  if (!Number.isFinite(input.fileSizeBytes) || input.fileSizeBytes < 1) {
    errors.push("Choose an image file with content.");
  } else if (input.fileSizeBytes > PROFILE_MEDIA_MAX_BYTES) {
    errors.push("Choose an image smaller than 4 MB.");
  }

  if (input.bytes) {
    if (input.bytes.length !== input.fileSizeBytes) {
      errors.push("The uploaded image size could not be verified.");
    }

    const detectedMimeType = detectProfileMediaMimeType(input.bytes);
    if (!detectedMimeType) {
      errors.push("The selected file is not a supported image.");
    } else if (detectedMimeType !== mimeType) {
      errors.push("The selected image content does not match its file type.");
    }
  }

  if (errors.length > 0 || !isProfileMediaKind(kind) || !isProfileMediaMimeType(mimeType)) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: [],
    normalized: {
      kind,
      mimeType,
      // Never persist a user-controlled filename in a profile-media record or object key.
      storageFileName: `profile-${kind}.${FILE_EXTENSION_BY_MIME_TYPE[mimeType]}`,
    },
  };
}

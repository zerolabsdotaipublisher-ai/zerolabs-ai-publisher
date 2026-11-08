import { describe, expect, it } from "vitest";
import {
  PROFILE_MEDIA_MAX_BYTES,
  createProfileMediaObjectPath,
  isLegacyProfileMediaReference,
  isProfileMediaReference,
  isSupportedProfileMediaUrl,
  parseProfileMediaReference,
  toProfileMediaReference,
  validateProfileMediaUpload,
} from "@/lib/profile-media";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_BYTES = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const WEBP_BYTES = new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]);

describe("profile media references", () => {
  it("uses a durable Supabase Storage reference, never a signed URL", () => {
    const objectPath = createProfileMediaObjectPath({
      userId: "current_user",
      kind: "cover",
      generatedFileToken: "550e8400-e29b-41d4-a716-446655440000",
      mimeType: "image/jpeg",
    });
    const reference = toProfileMediaReference(objectPath);

    expect(objectPath).toBe("current_user/cover/profile-cover-550e8400-e29b-41d4-a716-446655440000.jpg");
    expect(reference).toBe(`supabase:profile-media:${objectPath}`);
    expect(parseProfileMediaReference(reference)).toBe(objectPath);
    expect(isProfileMediaReference(reference)).toBe(true);
    expect(reference).not.toContain("token=");
  });

  it("continues to recognize legacy media records and HTTPS URLs without treating them as new storage references", () => {
    expect(isLegacyProfileMediaReference("media:media_abc123_def456")).toBe(true);
    expect(isProfileMediaReference("media:media_abc123_def456")).toBe(false);
    expect(isSupportedProfileMediaUrl("media:media_abc123_def456")).toBe(true);
    expect(isSupportedProfileMediaUrl("https://images.example.com/legacy-avatar.png")).toBe(true);
    expect(isSupportedProfileMediaUrl("blob:local-preview")).toBe(false);
  });
});

describe("profile media upload validation", () => {
  it("accepts JPEG, PNG, and WebP image content and derives a controlled storage extension", () => {
    expect(validateProfileMediaUpload({
      kind: "avatar",
      fileName: "Mina portrait.png",
      mimeType: "image/png",
      fileSizeBytes: PNG_BYTES.length,
      bytes: PNG_BYTES,
    })).toMatchObject({ ok: true, normalized: { kind: "avatar", mimeType: "image/png", storageFileName: "profile-avatar.png" } });
    expect(validateProfileMediaUpload({
      kind: "cover",
      fileName: "Cover (approved).jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: JPEG_BYTES.length,
      bytes: JPEG_BYTES,
    })).toMatchObject({ ok: true, normalized: { kind: "cover", mimeType: "image/jpeg", storageFileName: "profile-cover.jpg" } });
    expect(validateProfileMediaUpload({
      kind: "cover",
      fileName: "Wide cover.webp",
      mimeType: "image/webp",
      fileSizeBytes: WEBP_BYTES.length,
      bytes: WEBP_BYTES,
    })).toMatchObject({ ok: true, normalized: { kind: "cover", mimeType: "image/webp", storageFileName: "profile-cover.webp" } });
  });

  it("accepts ordinary filename punctuation but rejects unsafe MIME, content, and size", () => {
    expect(validateProfileMediaUpload({
      kind: "cover",
      fileName: "Mina cover (final export).png",
      mimeType: "image/png",
      fileSizeBytes: PNG_BYTES.length,
      bytes: PNG_BYTES,
    })).toMatchObject({ ok: true });
    expect(validateProfileMediaUpload({
      kind: "cover",
      fileName: "cover.txt",
      mimeType: "text/plain",
      fileSizeBytes: PNG_BYTES.length,
      bytes: PNG_BYTES,
    })).toMatchObject({ ok: false, errors: expect.arrayContaining(["Choose a JPG, PNG, WebP, or GIF image."]) });
    expect(validateProfileMediaUpload({
      kind: "cover",
      fileName: "cover.jpg",
      mimeType: "image/jpeg",
      fileSizeBytes: PNG_BYTES.length,
      bytes: PNG_BYTES,
    })).toMatchObject({ ok: false, errors: expect.arrayContaining(["The selected image content does not match its file type."]) });
    expect(validateProfileMediaUpload({
      kind: "avatar",
      fileName: "avatar.png",
      mimeType: "image/png",
      fileSizeBytes: PROFILE_MEDIA_MAX_BYTES + 1,
    })).toMatchObject({ ok: false, errors: expect.arrayContaining(["Choose an image smaller than 4 MB."]) });
  });
});

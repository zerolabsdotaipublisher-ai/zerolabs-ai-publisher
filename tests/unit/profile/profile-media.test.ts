import { describe, expect, it } from "vitest";
import {
  PROFILE_MEDIA_MAX_BYTES,
  isProfileMediaReference,
  isSupportedProfileMediaUrl,
  parseProfileMediaReference,
  toProfileMediaReference,
  validateProfileMediaUpload,
} from "@/lib/profile-media";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("profile media references", () => {
  it("uses a durable application-controlled media reference instead of a URL", () => {
    const reference = toProfileMediaReference("media_abc123_def456");

    expect(reference).toBe("media:media_abc123_def456");
    expect(parseProfileMediaReference(reference)).toBe("media_abc123_def456");
    expect(isProfileMediaReference(reference)).toBe(true);
    expect(isProfileMediaReference("blob:local-preview")).toBe(false);
    expect(isSupportedProfileMediaUrl("https://images.example.com/legacy-avatar.png")).toBe(true);
    expect(isSupportedProfileMediaUrl("blob:local-preview")).toBe(false);
  });
});

describe("profile media upload validation", () => {
  it("accepts supported image content and derives a safe storage filename", () => {
    expect(validateProfileMediaUpload({
      kind: "avatar",
      fileName: "Mina portrait.png",
      mimeType: "image/png",
      fileSizeBytes: PNG_BYTES.length,
      bytes: PNG_BYTES,
    })).toMatchObject({
      ok: true,
      normalized: { kind: "avatar", mimeType: "image/png", storageFileName: "profile-avatar.png" },
    });
  });

  it("rejects non-image MIME types and image content that does not match its declared type", () => {
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
  });

  it("rejects oversized and unsafe filenames before storage", () => {
    expect(validateProfileMediaUpload({
      kind: "avatar",
      fileName: "../avatar.png",
      mimeType: "image/png",
      fileSizeBytes: PNG_BYTES.length,
      bytes: PNG_BYTES,
    })).toMatchObject({ ok: false, errors: expect.arrayContaining(["Choose an image with a safe filename."]) });

    expect(validateProfileMediaUpload({
      kind: "avatar",
      fileName: "avatar.png",
      mimeType: "image/png",
      fileSizeBytes: PROFILE_MEDIA_MAX_BYTES + 1,
    })).toMatchObject({ ok: false, errors: expect.arrayContaining(["Choose an image smaller than 5 MB."]) });
  });
});

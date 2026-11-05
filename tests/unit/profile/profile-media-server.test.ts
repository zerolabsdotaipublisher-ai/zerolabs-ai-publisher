import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  uploadOwnedMedia: vi.fn(),
  createOwnedMediaSignedUrl: vi.fn(),
  getOwnedMediaAsset: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/media/workflow", () => ({
  uploadOwnedMedia: mocks.uploadOwnedMedia,
  createOwnedMediaSignedUrl: mocks.createOwnedMediaSignedUrl,
}));
vi.mock("@/lib/media/storage", () => ({ getOwnedMediaAsset: mocks.getOwnedMediaAsset }));

import {
  ProfileMediaError,
  assertOwnedProfileMediaReference,
  resolveProfileMediaDisplayUrls,
  uploadProfileMedia,
} from "@/lib/profile-media-server";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function profileMediaAsset(kind: "avatar" | "cover") {
  return {
    id: "media_profile_fixture",
    userId: "current_user",
    tenantId: "current_user",
    provider: "wasabi" as const,
    bucket: "private-media",
    objectKey: "tenant/current_user/ai-publisher/2026-11-04/media_profile_fixture/profile-avatar.png",
    mediaType: "image" as const,
    mimeType: "image/png",
    originalFilename: "profile-avatar.png",
    fileSizeBytes: PNG_BYTES.length,
    usageMetadata: {},
    metadata: { profileMediaKind: kind, profileMediaOwnerId: "current_user" },
    status: "active" as const,
    createdAt: "2026-11-04T00:00:00.000Z",
    updatedAt: "2026-11-04T00:00:00.000Z",
  };
}

describe("profile media server workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("uploads through the existing owner-scoped media workflow and returns a durable reference", async () => {
    mocks.uploadOwnedMedia.mockResolvedValue({
      media: { id: "media_profile_fixture" },
      signed: { url: "https://signed.example/avatar", expiresAt: "2026-11-04T01:00:00.000Z" },
    });

    await expect(uploadProfileMedia({
      userId: "current_user",
      kind: "avatar",
      fileName: "Mina portrait.png",
      mimeType: "image/png",
      fileSizeBytes: PNG_BYTES.length,
      bytes: PNG_BYTES,
    })).resolves.toEqual({
      reference: "media:media_profile_fixture",
      previewUrl: "https://signed.example/avatar",
      expiresAt: "2026-11-04T01:00:00.000Z",
      fileName: "Mina portrait.png",
    });

    expect(mocks.uploadOwnedMedia).toHaveBeenCalledWith(expect.objectContaining({
      userId: "current_user",
      tenantId: "current_user",
      fileName: "profile-avatar.png",
      linkedContentId: "current_user",
      linkedContentType: "profile",
      metadata: { source: "profile_media", profileMediaKind: "avatar", profileMediaOwnerId: "current_user" },
    }));
  });

  it("accepts normal cover filename punctuation without using it as the storage key", async () => {
    mocks.uploadOwnedMedia.mockResolvedValue({
      media: { id: "media_cover_fixture" },
      signed: { url: "https://signed.example/cover", expiresAt: "2026-11-04T01:00:00.000Z" },
    });

    await expect(uploadProfileMedia({
      userId: "current_user",
      kind: "cover",
      fileName: "Cover [final], export!.png",
      mimeType: "image/png",
      fileSizeBytes: PNG_BYTES.length,
      bytes: PNG_BYTES,
    })).resolves.toMatchObject({ reference: "media:media_cover_fixture" });

    expect(mocks.uploadOwnedMedia).toHaveBeenCalledWith(expect.objectContaining({
      fileName: "profile-cover.png",
      metadata: { source: "profile_media", profileMediaKind: "cover", profileMediaOwnerId: "current_user" },
    }));
  });

  it("enforces current-user ownership and media slot before a reference can be saved", async () => {
    mocks.getOwnedMediaAsset.mockResolvedValue(null);

    await expect(assertOwnedProfileMediaReference({
      userId: "current_user",
      reference: "media:media_someone_else",
      kind: "avatar",
    })).rejects.toBeInstanceOf(ProfileMediaError);
    expect(mocks.getOwnedMediaAsset).toHaveBeenCalledWith("current_user", "media_someone_else");

    mocks.getOwnedMediaAsset.mockResolvedValue(profileMediaAsset("cover"));
    await expect(assertOwnedProfileMediaReference({
      userId: "current_user",
      reference: "media:media_profile_fixture",
      kind: "avatar",
    })).rejects.toBeInstanceOf(ProfileMediaError);
  });

  it("resolves persisted avatar and cover references to fresh signed display URLs on reload", async () => {
    mocks.getOwnedMediaAsset.mockImplementation(async (_userId: string, mediaId: string) => profileMediaAsset(mediaId.includes("cover") ? "cover" : "avatar"));
    mocks.createOwnedMediaSignedUrl.mockImplementation(async ({ mediaId }: { mediaId: string }) => ({
      url: `https://signed.example/${mediaId}`,
      expiresAt: "2026-11-04T01:00:00.000Z",
    }));

    await expect(resolveProfileMediaDisplayUrls({
      userId: "current_user",
      avatarReference: "media:media_avatar_fixture",
      coverReference: "media:media_cover_fixture",
    })).resolves.toEqual({
      avatarUrl: "https://signed.example/media_avatar_fixture",
      coverUrl: "https://signed.example/media_cover_fixture",
    });
  });
});

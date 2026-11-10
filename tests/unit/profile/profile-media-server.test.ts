import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const storage = {
    upload: vi.fn(),
    createSignedUrl: vi.fn(),
    remove: vi.fn(),
  };

  return {
    storage,
    from: vi.fn(() => storage),
    getSupabaseServiceClient: vi.fn(),
  };
});

vi.mock("server-only", () => ({}));
vi.mock("crypto", () => ({ randomUUID: () => "550e8400-e29b-41d4-a716-446655440000" }));
vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServiceClient: mocks.getSupabaseServiceClient,
  SupabaseServiceRoleError: class SupabaseServiceRoleError extends Error {},
}));

import {
  ProfileMediaError,
  assertOwnedProfileMediaReference,
  deleteOwnedProfileMediaReference,
  resolveProfileMediaDisplayUrls,
  uploadProfileMedia,
} from "@/lib/profile-media-server";

const PNG_BYTES = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const avatarPath = "current_user/avatar/profile-avatar-550e8400-e29b-41d4-a716-446655440000.png";
const coverPath = "current_user/cover/profile-cover-550e8400-e29b-41d4-a716-446655440000.png";
const backgroundPath = "current_user/background/profile-background-550e8400-e29b-41d4-a716-446655440000.png";

describe("profile media Supabase Storage workflow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getSupabaseServiceClient.mockReturnValue({ storage: { from: mocks.from } });
    mocks.storage.upload.mockResolvedValue({ data: { path: avatarPath }, error: null });
    mocks.storage.createSignedUrl.mockImplementation(async (path: string) => ({ data: { signedUrl: `https://signed.example/${path}?token=fresh` }, error: null }));
    mocks.storage.remove.mockResolvedValue({ data: [], error: null });
  });

  it("uploads an avatar to the private Supabase bucket with a generated user-scoped key and durable reference", async () => {
    const uploaded = await uploadProfileMedia({
      userId: "current_user",
      kind: "avatar",
      fileName: "Mina portrait.png",
      mimeType: "image/png",
      fileSizeBytes: PNG_BYTES.length,
      bytes: PNG_BYTES,
    });

    expect(mocks.from).toHaveBeenCalledWith("profile-media");
    expect(mocks.storage.upload).toHaveBeenCalledWith(avatarPath, PNG_BYTES, {
      contentType: "image/png",
      cacheControl: "3600",
      upsert: false,
    });
    expect(uploaded).toMatchObject({
      reference: `supabase:profile-media:${avatarPath}`,
      previewUrl: `https://signed.example/${avatarPath}?token=fresh`,
      fileName: "Mina portrait.png",
    });
    expect(uploaded.reference).not.toContain("token=");
  });

  it("uploads a cover to its own user-scoped folder and accepts filename spaces and parentheses", async () => {
    const uploaded = await uploadProfileMedia({
      userId: "current_user",
      kind: "cover",
      fileName: "Mina cover (final).png",
      mimeType: "image/png",
      fileSizeBytes: PNG_BYTES.length,
      bytes: PNG_BYTES,
    });

    expect(mocks.storage.upload).toHaveBeenCalledWith(coverPath, PNG_BYTES, expect.objectContaining({ contentType: "image/png" }));
    expect(uploaded.reference).toBe(`supabase:profile-media:${coverPath}`);
  });

  it("uploads a page background to its own user-scoped folder", async () => {
    const uploaded = await uploadProfileMedia({
      userId: "current_user",
      kind: "background",
      fileName: "Profile canvas.png",
      mimeType: "image/png",
      fileSizeBytes: PNG_BYTES.length,
      bytes: PNG_BYTES,
    });

    expect(mocks.storage.upload).toHaveBeenCalledWith(backgroundPath, PNG_BYTES, expect.objectContaining({ contentType: "image/png" }));
    expect(uploaded.reference).toBe(`supabase:profile-media:${backgroundPath}`);
  });

  it("returns a structured retry-safe error when the storage write fails", async () => {
    mocks.storage.upload.mockResolvedValueOnce({ data: null, error: { message: "provider detail" } });

    await expect(uploadProfileMedia({
      userId: "current_user",
      kind: "cover",
      fileName: "cover.png",
      mimeType: "image/png",
      fileSizeBytes: PNG_BYTES.length,
      bytes: PNG_BYTES,
    })).rejects.toMatchObject({ code: "STORAGE_UPLOAD_FAILED", status: 502 });
  });

  it("enforces MIME and payload size validation before calling Supabase Storage", async () => {
    await expect(uploadProfileMedia({
      userId: "current_user",
      kind: "cover",
      fileName: "cover.txt",
      mimeType: "text/plain",
      fileSizeBytes: PNG_BYTES.length,
      bytes: PNG_BYTES,
    })).rejects.toMatchObject({ code: "INVALID_MIME_TYPE", status: 400 });
    expect(mocks.storage.upload).not.toHaveBeenCalled();
  });

  it("cleans an unreferenced object when its initial signed display URL cannot be made", async () => {
    mocks.storage.createSignedUrl.mockResolvedValueOnce({ data: null, error: { message: "signing detail" } });

    await expect(uploadProfileMedia({
      userId: "current_user",
      kind: "cover",
      fileName: "cover.png",
      mimeType: "image/png",
      fileSizeBytes: PNG_BYTES.length,
      bytes: PNG_BYTES,
    })).rejects.toMatchObject({ code: "SIGNED_URL_GENERATION_FAILED" });
    expect(mocks.storage.remove).toHaveBeenCalledWith([coverPath]);
  });

  it("prevents cross-user references at the application boundary", async () => {
    await expect(assertOwnedProfileMediaReference({
      userId: "current_user",
      reference: "supabase:profile-media:another_user/avatar/profile-avatar-550e8400-e29b-41d4-a716-446655440000.png",
      kind: "avatar",
    })).rejects.toBeInstanceOf(ProfileMediaError);
    expect(mocks.storage.upload).not.toHaveBeenCalled();
  });

  it("resolves saved avatar, cover, and background references to fresh signed URLs while legacy HTTPS still displays", async () => {
    await expect(resolveProfileMediaDisplayUrls({
      userId: "current_user",
      avatarReference: `supabase:profile-media:${avatarPath}`,
      coverReference: `supabase:profile-media:${coverPath}`,
      backgroundReference: `supabase:profile-media:${backgroundPath}`,
    })).resolves.toEqual({
      avatarUrl: `https://signed.example/${avatarPath}?token=fresh`,
      coverUrl: `https://signed.example/${coverPath}?token=fresh`,
      backgroundUrl: `https://signed.example/${backgroundPath}?token=fresh`,
    });

    await expect(resolveProfileMediaDisplayUrls({
      userId: "current_user",
      avatarReference: "https://images.example.com/legacy-avatar.png",
      coverReference: "media:media_old_profile_cover",
      backgroundReference: "https://images.example.com/legacy-background.png",
    })).resolves.toEqual({
      avatarUrl: "https://images.example.com/legacy-avatar.png",
      coverUrl: null,
      backgroundUrl: "https://images.example.com/legacy-background.png",
    });
  });

  it("deletes only a current user's matching slot after replacement or removal persists", async () => {
    await deleteOwnedProfileMediaReference({
      userId: "current_user",
      reference: `supabase:profile-media:${coverPath}`,
      kind: "cover",
    });

    expect(mocks.storage.remove).toHaveBeenCalledWith([coverPath]);
  });
});

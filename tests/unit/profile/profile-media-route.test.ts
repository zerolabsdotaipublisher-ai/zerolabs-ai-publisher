import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerUser: vi.fn(),
  uploadProfileMedia: vi.fn(),
  deleteOwnedProfileMediaReference: vi.fn(),
  loggerError: vi.fn(),
  ProfileMediaError: class ProfileMediaError extends Error {
    constructor(
      message: string,
      readonly code = "INVALID_IMAGE",
      readonly status = 400,
    ) {
      super(message);
    }
  },
}));

vi.mock("@/lib/supabase/server", () => ({ getServerUser: mocks.getServerUser }));
vi.mock("@/lib/profile-media-server", () => ({
  uploadProfileMedia: mocks.uploadProfileMedia,
  deleteOwnedProfileMediaReference: mocks.deleteOwnedProfileMediaReference,
  ProfileMediaError: mocks.ProfileMediaError,
}));
vi.mock("@/lib/observability", () => ({ logger: { error: mocks.loggerError } }));

import { DELETE, POST } from "@/app/api/profile/media/route";

function uploadRequest(kind: "avatar" | "cover" = "avatar") {
  const formData = new FormData();
  formData.set("kind", kind);
  formData.set("userId", "another_user");
  formData.set("file", new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], kind === "cover" ? "cover (final).png" : "avatar.png", { type: "image/png" }));
  return new Request("http://localhost/api/profile/media", { method: "POST", body: formData });
}

describe("/api/profile/media", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerUser.mockResolvedValue({ id: "current_user" });
    mocks.uploadProfileMedia.mockResolvedValue({
      reference: "supabase:profile-media:current_user/avatar/profile-avatar-550e8400-e29b-41d4-a716-446655440000.png",
      previewUrl: "https://signed.example/avatar?token=fresh",
      expiresAt: "2026-11-04T01:00:00.000Z",
      fileName: "avatar.png",
    });
    mocks.deleteOwnedProfileMediaReference.mockResolvedValue(undefined);
  });

  it("requires authentication", async () => {
    mocks.getServerUser.mockResolvedValue(null);

    const response = await POST(uploadRequest());

    expect(response.status).toBe(401);
    expect(mocks.uploadProfileMedia).not.toHaveBeenCalled();
  });

  it("passes the multipart file bytes, original name, MIME, and cover kind while deriving owner from the session", async () => {
    const response = await POST(uploadRequest("cover"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, media: { reference: expect.stringMatching(/^supabase:profile-media:/) } });
    expect(mocks.uploadProfileMedia).toHaveBeenCalledWith(expect.objectContaining({
      userId: "current_user",
      kind: "cover",
      fileName: "cover (final).png",
      mimeType: "image/png",
      fileSizeBytes: 4,
      bytes: expect.any(Uint8Array),
    }));
  });

  it("returns a safe structured storage error without provider details", async () => {
    mocks.uploadProfileMedia.mockRejectedValueOnce(new mocks.ProfileMediaError(
      "We couldn't write that image to profile storage. Your selection is still ready to retry.",
      "STORAGE_UPLOAD_FAILED",
      502,
    ));

    const response = await POST(uploadRequest("cover"));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "STORAGE_UPLOAD_FAILED",
        message: "We couldn't write that image to profile storage. Your selection is still ready to retry.",
      },
    });
    expect(mocks.loggerError).toHaveBeenCalledWith("POST /api/profile/media failed", expect.objectContaining({
      profileMediaErrorCode: "STORAGE_UPLOAD_FAILED",
      error: { name: "ProfileMediaError", message: "STORAGE_UPLOAD_FAILED" },
    }));
  });

  it("deletes a staged object only for the authenticated owner and requested slot", async () => {
    const response = await DELETE(new Request("http://localhost/api/profile/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: "supabase:profile-media:current_user/cover/profile-cover-550e8400-e29b-41d4-a716-446655440000.png",
        kind: "cover",
      }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.deleteOwnedProfileMediaReference).toHaveBeenCalledWith({
      userId: "current_user",
      reference: "supabase:profile-media:current_user/cover/profile-cover-550e8400-e29b-41d4-a716-446655440000.png",
      kind: "cover",
    });
  });
});

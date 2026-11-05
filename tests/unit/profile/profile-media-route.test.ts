import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getServerUser: vi.fn(),
  uploadProfileMedia: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ getServerUser: mocks.getServerUser }));
vi.mock("@/lib/profile-media-server", () => ({
  uploadProfileMedia: mocks.uploadProfileMedia,
  ProfileMediaError: class ProfileMediaError extends Error {},
}));

import { POST } from "@/app/api/profile/media/route";

function uploadRequest(kind: "avatar" | "cover" = "avatar") {
  const formData = new FormData();
  formData.set("kind", kind);
  formData.set("userId", "another_user");
  formData.set("file", new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], kind === "cover" ? "cover (final).png" : "avatar.png", { type: "image/png" }));
  return new Request("http://localhost/api/profile/media", { method: "POST", body: formData });
}

describe("POST /api/profile/media", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getServerUser.mockResolvedValue({ id: "current_user" });
    mocks.uploadProfileMedia.mockResolvedValue({
      reference: "media:media_avatar_fixture",
      previewUrl: "https://signed.example/avatar",
      expiresAt: "2026-11-04T01:00:00.000Z",
      fileName: "avatar.png",
    });
  });

  it("requires authentication", async () => {
    mocks.getServerUser.mockResolvedValue(null);

    const response = await POST(uploadRequest());

    expect(response.status).toBe(401);
    expect(mocks.uploadProfileMedia).not.toHaveBeenCalled();
  });

  it("uses the authenticated user rather than any client-supplied owner ID", async () => {
    const response = await POST(uploadRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({ ok: true, media: { reference: "media:media_avatar_fixture" } });
    expect(mocks.uploadProfileMedia).toHaveBeenCalledWith(expect.objectContaining({
      userId: "current_user",
      kind: "avatar",
      fileName: "avatar.png",
      mimeType: "image/png",
    }));
  });

  it("accepts a cover image and passes its cover slot to the owner-scoped upload workflow", async () => {
    const response = await POST(uploadRequest("cover"));

    expect(response.status).toBe(200);
    expect(mocks.uploadProfileMedia).toHaveBeenCalledWith(expect.objectContaining({
      userId: "current_user",
      kind: "cover",
      fileName: "cover (final).png",
      mimeType: "image/png",
    }));
  });

  it("returns a retry-safe error when storage upload fails", async () => {
    mocks.uploadProfileMedia.mockRejectedValueOnce(new Error("storage unavailable"));

    const response = await POST(uploadRequest());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "UPLOAD_FAILED",
        message: "We couldn't upload that image. Your selection is still ready to retry.",
      },
    });
  });
});

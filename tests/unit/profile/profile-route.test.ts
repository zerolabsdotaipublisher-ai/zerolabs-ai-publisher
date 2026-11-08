import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROFILE_APPEARANCE } from "@/lib/profile-appearance";
import type { Profile } from "@/lib/supabase/profile";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  ensureProfile: vi.fn(),
  updateProfile: vi.fn(),
  assertOwnedProfileMediaReference: vi.fn(),
  deleteOwnedProfileMediaReference: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/supabase/profile", () => ({
  ensureProfile: mocks.ensureProfile,
  updateProfile: mocks.updateProfile,
}));
vi.mock("@/lib/profile-media-server", () => ({
  assertOwnedProfileMediaReference: mocks.assertOwnedProfileMediaReference,
  deleteOwnedProfileMediaReference: mocks.deleteOwnedProfileMediaReference,
}));
vi.mock("@/lib/observability", () => ({ logger: { error: mocks.loggerError } }));

import { PATCH } from "@/app/api/profile/route";

function currentProfile(): Profile {
  return {
    id: "current_user",
    email: "owner@example.com",
    role: "user",
    full_name: "Owner",
    avatar_url: null,
    first_name: null,
    middle_name: null,
    last_name: null,
    suffix: null,
    username: null,
    country: null,
    date_of_birth: null,
    preferences: { unrelatedPreference: "preserved" },
    metadata: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
  };
}

describe("PATCH /api/profile appearance persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getUser.mockResolvedValue({ data: { user: { id: "current_user" } } });
    mocks.ensureProfile.mockResolvedValue(currentProfile());
    mocks.updateProfile.mockImplementation(async (_userId: string, updates: Record<string, unknown>) => ({ ...currentProfile(), ...updates }));
    mocks.deleteOwnedProfileMediaReference.mockResolvedValue(undefined);
  });

  it("persists a valid appearance for the authenticated user and preserves unrelated preferences", async () => {
    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ id: "another_user", profileAppearance: { ...DEFAULT_PROFILE_APPEARANCE, accent: "violet" } }),
    }));
    await expect(response.json()).resolves.toMatchObject({ ok: true, profile: { id: "current_user" } });

    expect(response.status).toBe(200);
    expect(mocks.updateProfile).toHaveBeenCalledWith("current_user", expect.objectContaining({
      preferences: expect.objectContaining({
        unrelatedPreference: "preserved",
        profileAppearance: expect.objectContaining({ accent: "violet" }),
      }),
    }));
  });

  it("rejects an invalid preset before persistence", async () => {
    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ profileAppearance: { ...DEFAULT_PROFILE_APPEARANCE, visualStyle: "dangerous" } }),
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Please fix the profile appearance settings and try again." },
      fieldErrors: { profileAppearance: "Choose a valid visual style." },
    });
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it("persists explicit public-detail visibility without replacing unrelated preferences", async () => {
    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ profileVisibility: { showAge: true, showLocation: false } }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.updateProfile).toHaveBeenCalledWith("current_user", expect.objectContaining({
      preferences: expect.objectContaining({
        unrelatedPreference: "preserved",
        profileVisibility: { showAge: true, showLocation: false },
      }),
    }));
  });

  it("rejects malformed public-detail visibility before persistence", async () => {
    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ profileVisibility: { showAge: "yes", showLocation: false } }),
    }));

    expect(response.status).toBe(400);
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it("requires an authenticated user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ profileAppearance: DEFAULT_PROFILE_APPEARANCE }),
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: { code: "UNAUTHORIZED" } });
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it("keeps account-information updates independent from public-profile preferences", async () => {
    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ full_name: "Updated owner", country: "Philippines" }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.updateProfile).toHaveBeenCalledWith("current_user", {
      full_name: "Updated owner",
      country: "Philippines",
    });
  });

  it("persists only validated durable avatar and cover references for the authenticated user", async () => {
    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({
        avatar_url: "supabase:profile-media:current_user/avatar/profile-avatar-550e8400-e29b-41d4-a716-446655440000.png",
        profileAppearance: { ...DEFAULT_PROFILE_APPEARANCE, coverUrl: "supabase:profile-media:current_user/cover/profile-cover-550e8400-e29b-41d4-a716-446655440000.png" },
      }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.assertOwnedProfileMediaReference).toHaveBeenCalledWith({
      userId: "current_user",
      reference: "supabase:profile-media:current_user/avatar/profile-avatar-550e8400-e29b-41d4-a716-446655440000.png",
      kind: "avatar",
    });
    expect(mocks.assertOwnedProfileMediaReference).toHaveBeenCalledWith({
      userId: "current_user",
      reference: "supabase:profile-media:current_user/cover/profile-cover-550e8400-e29b-41d4-a716-446655440000.png",
      kind: "cover",
    });
    expect(mocks.updateProfile).toHaveBeenCalledWith("current_user", expect.objectContaining({
      avatar_url: "supabase:profile-media:current_user/avatar/profile-avatar-550e8400-e29b-41d4-a716-446655440000.png",
      preferences: expect.objectContaining({
        profileAppearance: expect.objectContaining({ coverUrl: "supabase:profile-media:current_user/cover/profile-cover-550e8400-e29b-41d4-a716-446655440000.png" }),
      }),
    }));
  });

  it("rejects a profile-media reference the authenticated user does not own", async () => {
    mocks.assertOwnedProfileMediaReference.mockRejectedValueOnce(new Error("ownership required"));

    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ avatar_url: "supabase:profile-media:another_user/avatar/profile-avatar-550e8400-e29b-41d4-a716-446655440000.png" }),
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      ok: false,
      error: { code: "VALIDATION_ERROR", message: "Choose profile media uploaded to this account." },
      fieldErrors: { avatar_url: "Choose a saved profile picture from this account." },
    });
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it("removes an old Supabase avatar only after the replacement reference persists", async () => {
    const oldReference = "supabase:profile-media:current_user/avatar/profile-avatar-11111111-1111-4111-8111-111111111111.png";
    const nextReference = "supabase:profile-media:current_user/avatar/profile-avatar-550e8400-e29b-41d4-a716-446655440000.png";
    mocks.ensureProfile.mockResolvedValue({ ...currentProfile(), avatar_url: oldReference });
    mocks.updateProfile.mockResolvedValue({ ...currentProfile(), avatar_url: nextReference });

    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ avatar_url: nextReference }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.updateProfile).toHaveBeenCalledWith("current_user", { avatar_url: nextReference });
    expect(mocks.deleteOwnedProfileMediaReference).toHaveBeenCalledWith({
      userId: "current_user",
      reference: oldReference,
      kind: "avatar",
    });
  });

  it("does not delete the old object when profile persistence fails", async () => {
    const oldReference = "supabase:profile-media:current_user/cover/profile-cover-11111111-1111-4111-8111-111111111111.png";
    mocks.ensureProfile.mockResolvedValue({
      ...currentProfile(),
      preferences: { profileAppearance: { ...DEFAULT_PROFILE_APPEARANCE, coverUrl: oldReference } },
    });
    mocks.updateProfile.mockRejectedValueOnce(new Error("database detail"));

    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({
        profileAppearance: {
          ...DEFAULT_PROFILE_APPEARANCE,
          coverUrl: "supabase:profile-media:current_user/cover/profile-cover-550e8400-e29b-41d4-a716-446655440000.png",
        },
      }),
    }));

    expect(response.status).toBe(500);
    expect(mocks.deleteOwnedProfileMediaReference).not.toHaveBeenCalled();
  });

  it("continues to support legacy HTTPS avatar URLs", async () => {
    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ avatar_url: "https://images.example.com/legacy-avatar.png" }),
    }));

    expect(response.status).toBe(200);
    expect(mocks.assertOwnedProfileMediaReference).not.toHaveBeenCalled();
    expect(mocks.updateProfile).toHaveBeenCalledWith("current_user", { avatar_url: "https://images.example.com/legacy-avatar.png" });
  });

  it("returns a safe structured error and keeps server details out of the response", async () => {
    mocks.updateProfile.mockRejectedValueOnce(new Error("database connection detail that must remain private"));

    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ profileVisibility: { showAge: true, showLocation: false } }),
    }));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: {
        code: "PROFILE_UPDATE_FAILED",
        message: "We couldn't save your profile. Please try again.",
      },
    });
    expect(mocks.loggerError).toHaveBeenCalled();
  });
});

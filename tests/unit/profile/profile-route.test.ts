import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROFILE_APPEARANCE } from "@/lib/profile-appearance";
import type { Profile } from "@/lib/supabase/profile";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  ensureProfile: vi.fn(),
  updateProfile: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/supabase/profile", () => ({
  ensureProfile: mocks.ensureProfile,
  updateProfile: mocks.updateProfile,
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
  });

  it("persists a valid appearance for the authenticated user and preserves unrelated preferences", async () => {
    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ id: "another_user", profileAppearance: { ...DEFAULT_PROFILE_APPEARANCE, accent: "violet" } }),
    }));

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
    await expect(response.json()).resolves.toMatchObject({ fieldErrors: { profileAppearance: "Choose a valid visual style." } });
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });

  it("requires an authenticated user", async () => {
    mocks.getUser.mockResolvedValue({ data: { user: null } });

    const response = await PATCH(new Request("http://localhost/api/profile", {
      method: "PATCH",
      body: JSON.stringify({ profileAppearance: DEFAULT_PROFILE_APPEARANCE }),
    }));

    expect(response.status).toBe(401);
    expect(mocks.updateProfile).not.toHaveBeenCalled();
  });
});

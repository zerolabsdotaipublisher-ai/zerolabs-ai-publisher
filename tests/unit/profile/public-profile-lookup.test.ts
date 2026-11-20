import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  loggerWarn: vi.fn(),
  loggerError: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServiceClient: () => ({ from: mocks.from }),
}));
vi.mock("@/lib/admin/access", () => ({
  isAdminEmail: () => false,
  resolveAdminRole: (_email: string, role?: string) => role === "admin" ? "admin" : "user",
}));
vi.mock("@/lib/observability", () => ({
  logger: { warn: mocks.loggerWarn, error: mocks.loggerError },
}));

import { getPublicProfileByProfileUserId, getPublicProfileByUsername } from "@/lib/supabase/profile";

const profileUserId = "11111111-1111-4111-8111-111111111111";
const row = {
  id: profileUserId,
  full_name: "Legacy Author",
  avatar_url: null,
  first_name: "Legacy",
  last_name: "Author",
  username: null,
  country: "Philippines",
  date_of_birth: "1990-05-11",
  preferences: { profileVisibility: { showAge: false } },
};

function mockProfileLookup(data: typeof row | null) {
  const maybeSingle = vi.fn().mockResolvedValue({ data, error: null });
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq }));
  mocks.from.mockReturnValue({ select });
  return { select, eq, maybeSingle };
}

describe("public profile lookup routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resolves a username-less profile by its exact durable ID and selects only public fields", async () => {
    const query = mockProfileLookup(row);

    await expect(getPublicProfileByProfileUserId(` ${profileUserId} `)).resolves.toEqual(row);

    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(query.select).toHaveBeenCalledWith("id, full_name, avatar_url, first_name, last_name, username, country, date_of_birth, preferences");
    expect(query.eq).toHaveBeenCalledWith("id", profileUserId);
  });

  it("keeps username lookup on the username key instead of treating an identifier as a username fallback", async () => {
    const query = mockProfileLookup(null);

    await expect(getPublicProfileByUsername("legacy_author")).resolves.toBeNull();

    expect(query.eq).toHaveBeenCalledTimes(1);
    expect(query.eq).toHaveBeenCalledWith("username", "legacy_author");
  });

  it("loads a real legacy profile when optional preferences are absent from the database schema", async () => {
    const { preferences: _preferences, ...rowWithoutPreferences } = row;
    const initialMaybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "42703", message: "column profiles.preferences does not exist" },
    });
    const fallbackMaybeSingle = vi.fn().mockResolvedValue({ data: rowWithoutPreferences, error: null });
    const initialEq = vi.fn(() => ({ maybeSingle: initialMaybeSingle }));
    const fallbackEq = vi.fn(() => ({ maybeSingle: fallbackMaybeSingle }));
    const select = vi
      .fn()
      .mockReturnValueOnce({ eq: initialEq })
      .mockReturnValueOnce({ eq: fallbackEq });
    mocks.from.mockReturnValue({ select });

    await expect(getPublicProfileByProfileUserId(profileUserId)).resolves.toEqual({
      ...rowWithoutPreferences,
      preferences: null,
    });

    expect(select).toHaveBeenNthCalledWith(
      1,
      "id, full_name, avatar_url, first_name, last_name, username, country, date_of_birth, preferences",
    );
    expect(select).toHaveBeenNthCalledWith(
      2,
      "id, full_name, avatar_url, first_name, last_name, username, country, date_of_birth",
    );
    expect(initialEq).toHaveBeenCalledWith("id", profileUserId);
    expect(fallbackEq).toHaveBeenCalledWith("id", profileUserId);
    expect(mocks.loggerWarn).toHaveBeenCalledOnce();
  });

  it("does not translate an unexpected profile lookup failure into an absent profile", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "XX000", message: "database lookup failed" },
    });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    mocks.from.mockReturnValue({ select });

    await expect(getPublicProfileByProfileUserId(profileUserId)).rejects.toThrow("Unable to load the public profile.");

    expect(mocks.loggerError).toHaveBeenCalledOnce();
  });

  it("does not send a malformed profile user ID to Supabase", async () => {
    await expect(getPublicProfileByProfileUserId("not-a-profile-user-id")).resolves.toBeNull();

    expect(mocks.from).not.toHaveBeenCalled();
  });
});

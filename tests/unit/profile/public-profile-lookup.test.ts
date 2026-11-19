import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServiceClient: () => ({ from: mocks.from }),
}));
vi.mock("@/lib/admin/access", () => ({
  isAdminEmail: () => false,
  resolveAdminRole: (_email: string, role?: string) => role === "admin" ? "admin" : "user",
}));
vi.mock("@/lib/observability", () => ({
  logger: { warn: mocks.loggerWarn, error: vi.fn() },
}));

import { getPublicProfileById, getPublicProfileByUsername } from "@/lib/supabase/profile";

const row = {
  id: "legacy_author",
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

    await expect(getPublicProfileById(" legacy_author ")).resolves.toEqual(row);

    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(query.select).toHaveBeenCalledWith("id, full_name, avatar_url, first_name, last_name, username, country, date_of_birth, preferences");
    expect(query.eq).toHaveBeenCalledWith("id", "legacy_author");
  });

  it("keeps username lookup on the username key instead of treating an identifier as a username fallback", async () => {
    const query = mockProfileLookup(null);

    await expect(getPublicProfileByUsername("legacy_author")).resolves.toBeNull();

    expect(query.eq).toHaveBeenCalledTimes(1);
    expect(query.eq).toHaveBeenCalledWith("username", "legacy_author");
  });
});

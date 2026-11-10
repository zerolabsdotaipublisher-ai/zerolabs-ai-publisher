import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PROFILE_APPEARANCE } from "@/lib/profile-appearance";

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
  getUserById: vi.fn(),
  updateUserById: vi.fn(),
  loggerError: vi.fn(),
  loggerWarn: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServiceClient: () => ({
    from: mocks.from,
    auth: {
      admin: {
        getUserById: mocks.getUserById,
        updateUserById: mocks.updateUserById,
      },
    },
  }),
}));
vi.mock("@/lib/admin/access", () => ({
  isAdminEmail: () => false,
  resolveAdminRole: (_email: string, role?: string) => role === "admin" ? "admin" : "user",
}));
vi.mock("@/lib/observability", () => ({
  logger: { error: mocks.loggerError, warn: mocks.loggerWarn },
}));

import { ensureProfile, updateProfile } from "@/lib/supabase/profile";

const profileRow = {
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
  preferences: null,
  metadata: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
};

function profileSelectResult(data = profileRow) {
  return {
    eq: vi.fn(() => ({
      single: vi.fn().mockResolvedValue({ data, error: null }),
    })),
  };
}

describe("profile preference persistence compatibility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reloads controlled preferences from auth metadata when a legacy profile row has no preferences column", async () => {
    mocks.from.mockReturnValue({ select: vi.fn(() => profileSelectResult()) });

    const result = await ensureProfile({
      id: "current_user",
      email: "owner@example.com",
      created_at: "2026-01-01T00:00:00.000Z",
      user_metadata: {
        profile_customization: {
          profileAppearance: { ...DEFAULT_PROFILE_APPEARANCE, accent: "violet" },
          profileVisibility: { showAge: true, showLocation: false },
        },
      },
    } as never);

    expect(result.preferences).toMatchObject({
      profileAppearance: { accent: "violet" },
      profileVisibility: { showAge: true, showLocation: false },
    });
  });

  it("falls back to authenticated metadata when Supabase cannot persist profiles.preferences", async () => {
    const preferenceError = { code: "PGRST204", message: "preferences is unavailable" };
    const initialUpdate = {
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn().mockResolvedValue({ data: null, error: preferenceError }),
        })),
      })),
    };
    const select = vi.fn(() => profileSelectResult());
    mocks.from.mockReturnValue({ update: vi.fn(() => initialUpdate), select });
    mocks.getUserById.mockResolvedValue({ data: { user: { user_metadata: { existing: "keep" } } }, error: null });
    mocks.updateUserById.mockResolvedValue({ error: null });

    const backgroundReference = "supabase:profile-media:current_user/background/profile-background-550e8400-e29b-41d4-a716-446655440000.png";
    const appearance = {
      ...DEFAULT_PROFILE_APPEARANCE,
      accent: "amber" as const,
      background: { type: "image" as const, preset: "image" as const, color: null, imageUrl: backgroundReference },
    };
    const preferences = {
      unrelatedPreference: "preserved-in-profile-when-supported",
      profileAppearance: appearance,
      profileVisibility: { showAge: false, showLocation: true },
    };
    const result = await updateProfile("current_user", { preferences });

    expect(mocks.updateUserById).toHaveBeenCalledWith("current_user", {
      user_metadata: {
        existing: "keep",
        profile_customization: {
          profileAppearance: appearance,
          profileVisibility: { showAge: false, showLocation: true },
        },
      },
    });
    expect(result.preferences).toEqual({
      profileAppearance: appearance,
      profileVisibility: { showAge: false, showLocation: true },
    });
    expect(mocks.loggerWarn).toHaveBeenCalled();
  });
});

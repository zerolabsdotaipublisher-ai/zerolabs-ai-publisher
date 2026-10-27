import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileForm } from "@/components/profile/profile-form";
import { PublicProfilePreview } from "@/components/profile/profile-preview";
import {
  DEFAULT_PROFILE_APPEARANCE,
  getProfileAppearance,
  mergeProfileAppearance,
  validateProfileAppearance,
} from "@/lib/profile-appearance";
import { normalizeEditableProfileUpdate, validateEditableProfileUpdate } from "@/lib/profile-validation";
import type { Profile } from "@/lib/supabase/profile";

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "user_fixture",
    email: "private@example.com",
    role: "user",
    full_name: "Mina Park",
    avatar_url: null,
    first_name: "Mina",
    middle_name: null,
    last_name: "Park",
    suffix: null,
    username: "mina",
    country: "Philippines",
    date_of_birth: "1990-05-11",
    preferences: null,
    metadata: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("profile appearance preferences", () => {
  it("uses safe defaults when preferences are absent or malformed", () => {
    expect(getProfileAppearance(null)).toEqual(DEFAULT_PROFILE_APPEARANCE);
    expect(getProfileAppearance({ profileAppearance: { visualStyle: "unsafe-css" } })).toEqual(DEFAULT_PROFILE_APPEARANCE);
  });

  it("merges the dedicated appearance key without losing unrelated preferences", () => {
    const next = mergeProfileAppearance(
      { dashboardLayout: "dense", unrelatedFeature: { enabled: true } },
      { ...DEFAULT_PROFILE_APPEARANCE, accent: "violet" },
    );

    expect(next).toMatchObject({
      dashboardLayout: "dense",
      unrelatedFeature: { enabled: true },
      profileAppearance: { accent: "violet" },
    });
  });

  it("accepts a complete controlled appearance and rejects unsupported preset values", () => {
    const valid = {
      ...DEFAULT_PROFILE_APPEARANCE,
      coverUrl: "https://images.example.com/cover.png",
      background: { type: "solid", preset: "forest", imageUrl: null },
      visualStyle: "glass",
      cardShape: "pill-soft",
      accent: "blue",
      textAlignment: "center",
      contentWidth: "wide",
    } as const;

    expect(validateProfileAppearance(valid)).toEqual({});
    expect(validateProfileAppearance({ ...valid, accent: "neon" })).toMatchObject({ accent: "Choose a valid accent treatment." });
  });

  it("validates avatar and cover URLs as safe web URLs", () => {
    expect(validateEditableProfileUpdate(normalizeEditableProfileUpdate({ avatar_url: "javascript:alert(1)" }))).toMatchObject({
      avatar_url: "Avatar URL must start with http:// or https://.",
    });
    expect(validateProfileAppearance({ ...DEFAULT_PROFILE_APPEARANCE, coverUrl: "javascript:alert(1)" })).toHaveProperty("coverUrl");
  });
});

describe("profile customization UI", () => {
  it("renders the live-preview controls and separates customization, account, and security", () => {
    const markup = renderToStaticMarkup(<ProfileForm profile={profile()} />);

    expect(markup).toContain("Live public profile preview");
    expect(markup).toContain("Profile picture URL");
    expect(markup).toContain("Cover photo URL");
    expect(markup).toContain("Visual style");
    expect(markup).toContain("aria-pressed=\"true\"");
    expect(markup).toContain("Account information");
    expect(markup).toContain("Change password");
  });

  it("renders preview changes from appearance state without exposing private profile fields", () => {
    const appearance = {
      ...DEFAULT_PROFILE_APPEARANCE,
      accent: "violet" as const,
      textAlignment: "center" as const,
      visualStyle: "glass" as const,
    };
    const markup = renderToStaticMarkup(
      <PublicProfilePreview appearance={appearance} avatarUrl={null} displayName="Mina Park" username="mina" country="Philippines" />,
    );

    expect(markup).toContain("profile-preview-accent-violet");
    expect(markup).toContain("profile-preview-align-center");
    expect(markup).toContain("profile-preview-style-glass");
    expect(markup).not.toContain("private@example.com");
    expect(markup).not.toContain("1990-05-11");
  });
});

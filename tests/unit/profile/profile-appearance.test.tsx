import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileForm } from "@/components/profile/profile-form";
import { ProfileContent } from "@/components/profile/profile-content";
import { PublicProfilePreview } from "@/components/profile/profile-preview";
import { ProfileView } from "@/components/profile/profile-view";
import {
  DEFAULT_PROFILE_APPEARANCE,
  getProfileAppearance,
  mergeProfileAppearance,
  validateProfileAppearance,
} from "@/lib/profile-appearance";
import { normalizeEditableProfileUpdate, validateEditableProfileUpdate } from "@/lib/profile-validation";
import { getProfileAge, getProfileVisibility, mergeProfileVisibility, validateProfileVisibility } from "@/lib/profile-visibility";
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

describe("profile visibility preferences", () => {
  it("keeps legacy profiles private and merges explicit visibility without losing preferences", () => {
    expect(getProfileVisibility(null)).toEqual({ showAge: false, showLocation: false });
    expect(mergeProfileVisibility({ dashboardLayout: "dense" }, { showAge: true, showLocation: false })).toMatchObject({
      dashboardLayout: "dense",
      profileVisibility: { showAge: true, showLocation: false },
    });
    expect(validateProfileVisibility({ showAge: true, showLocation: "yes" })).toHaveProperty("showLocation");
  });

  it("calculates a safe age without returning the date of birth", () => {
    const today = new Date("2026-10-29T00:00:00.000Z");

    expect(getProfileAge("2000-10-29", today)).toBe(26);
    expect(getProfileAge("2000-10-30", today)).toBe(25);
    expect(getProfileAge("2000-02-30", today)).toBeNull();
  });
});

describe("profile customization UI", () => {
  it("keeps the profile route read-only and provides a dedicated edit entry point", () => {
    const markup = renderToStaticMarkup(<ProfileView profile={profile()} />);

    expect(markup).toContain('aria-label="Mina Park profile"');
    expect(markup).toContain("Edit profile");
    expect(markup).toContain('href="/profile/customize"');
    expect(markup).toContain("profile-public-profile");
    expect(markup).toContain("MP");
    expect(markup).not.toContain("Creator profile");
    expect(markup).not.toContain("Live public profile preview");
    expect(markup).not.toContain("Profile picture URL");
    expect(markup).not.toContain("Save account information");
    expect(markup).not.toContain("Account information");
    expect(markup).not.toContain("Change password");
    expect(markup).not.toContain("private@example.com");
    expect(markup).not.toContain("1990-05-11");
    expect(markup).not.toContain("Philippines");
    expect(markup).not.toContain("years old");
  });

  it("renders the live-preview controls and separates customization, account, and security", () => {
    const markup = renderToStaticMarkup(<ProfileForm profile={profile()} />);

    expect(markup).toContain("Live public profile preview");
    expect(markup).toContain("Profile picture URL");
    expect(markup).toContain("Cover photo URL");
    expect(markup).toContain("Visual style");
    expect(markup).toContain("Public details");
    expect(markup).toContain("Show age");
    expect(markup).toContain("aria-pressed=\"true\"");
    expect(markup).toContain("Account information");
    expect(markup).toContain("Change password");
  });

  it("uses only explicitly visible metadata and applies appearance to populated public content", () => {
    const appearance = {
      ...DEFAULT_PROFILE_APPEARANCE,
      accent: "violet" as const,
      visualStyle: "glass" as const,
      cardShape: "pill-soft" as const,
      textAlignment: "center" as const,
      contentWidth: "wide" as const,
    };
    const profileMarkup = renderToStaticMarkup(
      <ProfileView profile={profile({ preferences: { profileVisibility: { showAge: true, showLocation: true } } })} />,
    );
    const contentMarkup = renderToStaticMarkup(
      <ProfileContent
        appearance={appearance}
        websites={[{ id: "site_fixture", site_title: "Mina's studio" }]}
        posts={[{ id: "post_fixture", title: "A recent update", body: "A public community update.", created_at: "2026-10-28T00:00:00.000Z" }]}
      />,
    );

    expect(profileMarkup).toContain("Philippines");
    expect(profileMarkup).toContain("years old");
    expect(profileMarkup).not.toContain("1990-05-11");
    expect(contentMarkup).toContain("Mina&#x27;s studio");
    expect(contentMarkup).toContain("A recent update");
    expect(contentMarkup).toContain("profile-content-style-glass");
    expect(contentMarkup).toContain("profile-content-shape-pill-soft");
    expect(contentMarkup).toContain("profile-content-accent-violet");
    expect(contentMarkup).toContain("profile-content-align-center");
    expect(contentMarkup).toContain("profile-content-width-wide");
  });

  it("omits unsupported or empty public content without blank cards", () => {
    const markup = renderToStaticMarkup(
      <ProfileContent
        appearance={DEFAULT_PROFILE_APPEARANCE}
        websites={[{ id: "empty_site", site_title: "undefined" }]}
        posts={[{ id: "empty_post", title: "null", body: "  ", created_at: "not-a-date" }]}
      />,
    );

    expect(markup).toBe("");
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

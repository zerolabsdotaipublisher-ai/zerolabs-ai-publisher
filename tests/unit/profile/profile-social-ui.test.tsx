import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileView } from "@/components/profile/profile-view";
import { DEFAULT_PROFILE_APPEARANCE } from "@/lib/profile-appearance";
import type { Profile } from "@/lib/supabase/profile";

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "profile_owner",
    email: "owner@example.com",
    role: "user",
    full_name: "Razel Sison",
    avatar_url: null,
    first_name: "Razel",
    middle_name: null,
    last_name: "Sison",
    suffix: null,
    username: "razmay",
    country: null,
    date_of_birth: null,
    preferences: null,
    metadata: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("profile social-stat hero", () => {
  it("renders the viewed profile's follower and following counts directly below the username", () => {
    const markup = renderToStaticMarkup(
      <ProfileView profile={profile()} socialStats={{ followersCount: 24, followingCount: 18 }} />,
    );

    expect(markup).toContain("Razel Sison");
    expect(markup).toContain("@razmay");
    expect(markup).toContain("24 Followers");
    expect(markup).toContain("18 Following");
    expect(markup.indexOf("@razmay")).toBeLessThan(markup.indexOf("24 Followers"));
    expect(markup).toContain('class="profile-social-stats"');
    expect(markup).not.toMatch(/<button[^>]*>[^<]*(Followers|Following)/);
  });

  it("uses singular Follower and plural Followers labels, including the zero state", () => {
    const singularMarkup = renderToStaticMarkup(
      <ProfileView profile={profile()} socialStats={{ followersCount: 1, followingCount: 1 }} />,
    );
    const zeroMarkup = renderToStaticMarkup(<ProfileView profile={profile()} />);

    expect(singularMarkup).toContain("1 Follower");
    expect(singularMarkup).not.toContain("1 Followers");
    expect(singularMarkup).toContain("1 Following");
    expect(zeroMarkup).toContain("0 Followers");
    expect(zeroMarkup).toContain("0 Following");
  });

  it("keeps the social-stat row responsive and independent from profile avatar, cover, and page background layers", () => {
    const avatarUrl = "https://signed.example/avatar?token=fresh";
    const coverUrl = "https://signed.example/cover?token=fresh";
    const backgroundUrl = "https://signed.example/background?token=fresh";
    const markup = renderToStaticMarkup(
      <ProfileView
        profile={profile({
          preferences: {
            profileAppearance: {
              ...DEFAULT_PROFILE_APPEARANCE,
              coverUrl: "supabase:profile-media:profile_owner/cover/profile-cover-550e8400-e29b-41d4-a716-446655440000.png",
              background: {
                type: "image",
                preset: "aurora",
                color: null,
                imageUrl: "supabase:profile-media:profile_owner/background/profile-background-550e8400-e29b-41d4-a716-446655440000.png",
              },
            },
          },
        })}
        mediaUrls={{ avatarUrl, coverUrl, backgroundUrl }}
        socialStats={{ followersCount: 2, followingCount: 4 }}
      />,
    );
    const css = readFileSync("app/globals.css", "utf8");

    expect(markup).toContain('src="https://signed.example/background?token=fresh"');
    expect(markup).toContain('src="https://signed.example/cover?token=fresh"');
    expect(markup).toContain('src="https://signed.example/avatar?token=fresh"');
    expect(markup).toContain("2 Followers");
    expect(css).toMatch(/\.profile-social-stats \{[\s\S]*?flex-wrap: wrap;/);
    expect(css).toContain(".profile-social-stats { gap: 0.3rem 0.75rem; font-size: 0.82rem; }");
  });
});

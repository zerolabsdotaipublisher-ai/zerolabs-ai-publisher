import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ProfileView } from "@/components/profile/profile-view";
import { getPublicProfileHref, getPublicProfileUserIdHref } from "@/lib/profile-public";
import type { Profile } from "@/lib/supabase/profile";

const profileUserId = "22222222-2222-4222-8222-222222222222";

function profile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: "profile_user",
    email: "private@example.com",
    role: "user",
    full_name: "Avery Builder",
    avatar_url: null,
    first_name: "Avery",
    middle_name: null,
    last_name: "Builder",
    suffix: null,
    username: "avery.builds",
    country: "Philippines",
    date_of_birth: "1990-05-11",
    preferences: { profileVisibility: { showAge: true, showLocation: true } },
    metadata: { secret: "not public" },
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("public profile identity and visitor controls", () => {
  it("builds a safe canonical public route and leaves missing legacy usernames unlinked", () => {
    expect(getPublicProfileHref({ username: "avery.builds", profileUserId })).toBe("/profile/u/avery.builds");
    expect(getPublicProfileHref({ username: "  avery builds  ", profileUserId })).toBe("/profile/u/avery%20builds");
    expect(getPublicProfileHref({ profileUserId })).toBe(`/profile/u/id/${profileUserId}`);
    expect(getPublicProfileHref({ username: "   ", profileUserId: "   " })).toBeNull();
  });

  it("uses a distinct durable-identifier route when a legacy Feed author has no username", () => {
    expect(getPublicProfileUserIdHref(profileUserId)).toBe(`/profile/u/id/${profileUserId}`);
    expect(getPublicProfileUserIdHref(`  ${profileUserId}  `)).toBe(`/profile/u/id/${profileUserId}`);
    expect(getPublicProfileHref({ profileUserId })).toBe(`/profile/u/id/${profileUserId}`);
    expect(getPublicProfileHref({ username: "avery.builds", profileUserId })).toBe("/profile/u/avery.builds");
    expect(getPublicProfileHref({ profileUserId: "   " })).toBeNull();
    expect(getPublicProfileUserIdHref("not-a-profile-user-id")).toBeNull();
  });

  it("keeps owner and viewed identities distinct: an owner gets Edit profile, never Follow", () => {
    const markup = renderToStaticMarkup(<ProfileView profile={profile()} viewerUserId="profile_user" />);

    expect(markup).toContain("Edit profile");
    expect(markup).not.toContain("Follow</button>");
  });

  it("shows visitor Follow or Following state and renders the viewed profile's live social counts", () => {
    const followMarkup = renderToStaticMarkup(
      <ProfileView profile={profile()} viewerUserId="viewer_user" isFollowing={false} socialStats={{ followersCount: 4, followingCount: 7 }} />,
    );
    const followingMarkup = renderToStaticMarkup(
      <ProfileView profile={profile()} viewerUserId="viewer_user" isFollowing socialStats={{ followersCount: 5, followingCount: 7 }} />,
    );

    expect(followMarkup).toContain(">Follow</button>");
    expect(followMarkup).not.toContain("Edit profile");
    expect(followMarkup).toContain("4 Followers");
    expect(followMarkup).toContain("7 Following");
    expect(followingMarkup).toContain(">Following</button>");
  });

  it("renders only allowed public details and supplied public content for a visitor", () => {
    const markup = renderToStaticMarkup(
      <ProfileView
        profile={profile()}
        viewerUserId="viewer_user"
        websites={[{ id: "site_fixture", site_title: "Avery's public site" }]}
        posts={[{ id: "public_post", title: "Public update", body: "Visible update.", created_at: "2026-01-01T00:00:00.000Z" }]}
      />,
    );

    expect(markup).toContain("Avery&#x27;s public site");
    expect(markup).toContain("Public update");
    expect(markup).toContain("Philippines");
    expect(markup).toContain("years old");
    expect(markup).not.toContain("private@example.com");
    expect(markup).not.toContain("1990-05-11");
    expect(markup).not.toContain("not public");
  });
});

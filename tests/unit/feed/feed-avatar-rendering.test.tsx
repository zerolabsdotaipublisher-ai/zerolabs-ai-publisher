import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getSafeProfile: vi.fn(),
  createFallbackProfile: vi.fn(),
  getProfileDisplayName: vi.fn(),
  resolveProfileMediaDisplayUrl: vi.fn(),
  getCommunityFeed: vi.fn(),
  getPublicWebsites: vi.fn(),
  getPublicWebsitesForOwner: vi.fn(),
  getSavedCommunityItems: vi.fn(),
  createCommunityPost: vi.fn(),
  createCommunityPostComment: vi.fn(),
  deleteCommunityPost: vi.fn(),
  shareCommunityPost: vi.fn(),
  toggleCommunityPostReaction: vi.fn(),
  toggleSavedCommunityPost: vi.fn(),
}));

vi.mock("@/lib/supabase/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/supabase/profile", () => ({
  getSafeProfile: mocks.getSafeProfile,
  createFallbackProfile: mocks.createFallbackProfile,
  getProfileDisplayName: mocks.getProfileDisplayName,
}));
vi.mock("@/lib/profile-media-server", () => ({ resolveProfileMediaDisplayUrl: mocks.resolveProfileMediaDisplayUrl }));
vi.mock("@/app/(app)/feed/queries", () => ({
  getCommunityFeed: mocks.getCommunityFeed,
  getPublicWebsites: mocks.getPublicWebsites,
  getPublicWebsitesForOwner: mocks.getPublicWebsitesForOwner,
  getSavedCommunityItems: mocks.getSavedCommunityItems,
}));
vi.mock("@/app/(app)/feed/actions", () => ({
  createCommunityPost: mocks.createCommunityPost,
  createCommunityPostComment: mocks.createCommunityPostComment,
  deleteCommunityPost: mocks.deleteCommunityPost,
  shareCommunityPost: mocks.shareCommunityPost,
  toggleCommunityPostReaction: mocks.toggleCommunityPostReaction,
  toggleSavedCommunityPost: mocks.toggleSavedCommunityPost,
}));
vi.mock("@/app/(app)/feed/post-composer", () => ({ PostComposer: () => <div data-testid="post-composer" /> }));
vi.mock("@/app/(app)/feed/website-list", () => ({ PublicWebsiteList: () => <div data-testid="public-website-list" /> }));

import FeedPage from "@/app/(app)/feed/page";
import { FeedAvatar } from "@/app/(app)/feed/avatar";

const signedAvatarUrl = "https://signed.example/profile-avatar.png?token=fresh";
const durableAvatarReference = "supabase:profile-media:current_user/avatar/profile-avatar-550e8400-e29b-41d4-a716-446655440000.png";

describe("community feed avatar rendering", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "current_user", email: "avery@example.com" });
    mocks.getSafeProfile.mockResolvedValue({ id: "current_user", full_name: "Avery Builder", avatar_url: durableAvatarReference });
    mocks.getProfileDisplayName.mockReturnValue("Avery Builder");
    mocks.resolveProfileMediaDisplayUrl.mockResolvedValue(signedAvatarUrl);
    mocks.getCommunityFeed.mockResolvedValue([]);
    mocks.getPublicWebsites.mockResolvedValue([]);
    mocks.getPublicWebsitesForOwner.mockResolvedValue([]);
    mocks.getSavedCommunityItems.mockResolvedValue({ items: [], isAvailable: true });
  });

  it("renders the current saved profile avatar in the Community sidebar through the profile-media resolver", async () => {
    const markup = renderToStaticMarkup(await FeedPage());

    expect(markup).toContain('class="feed-profile-avatar"');
    expect(markup).toContain(`src="${signedAvatarUrl.replace(/&/g, "&amp;")}"`);
    expect(markup).not.toContain(durableAvatarReference);
    expect(mocks.resolveProfileMediaDisplayUrl).toHaveBeenCalledWith({
      userId: "current_user",
      reference: durableAvatarReference,
      kind: "avatar",
    });
  });

  it("renders post author display URLs and retains the initials fallback when no avatar is available", () => {
    const postListSource = readFileSync(resolve(process.cwd(), "app/(app)/feed/post-list.tsx"), "utf8");
    const avatarMarkup = renderToStaticMarkup(<FeedAvatar className="feed-post-avatar" avatarDisplayUrl={signedAvatarUrl} initials="AB" />);
    const fallbackMarkup = renderToStaticMarkup(<FeedAvatar className="feed-post-avatar" avatarDisplayUrl={null} initials="AB" />);

    expect(postListSource).toContain('className="feed-post-avatar"');
    expect(postListSource).toContain("avatarDisplayUrl={post.author.avatarDisplayUrl}");
    expect(avatarMarkup).toContain('class="feed-post-avatar"');
    expect(avatarMarkup).toContain(`src="${signedAvatarUrl.replace(/&/g, "&amp;")}"`);
    expect(avatarMarkup).not.toContain(durableAvatarReference);
    expect(fallbackMarkup).toContain('class="feed-post-avatar"');
    expect(fallbackMarkup).toContain(">AB</div>");
    expect(fallbackMarkup).not.toContain("<img");
  });
});

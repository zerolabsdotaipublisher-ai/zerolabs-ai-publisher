import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PostList } from "@/app/(app)/feed/post-list";
import type { CommunityPostRecord } from "@/app/(app)/feed/types";

vi.mock("@/app/(app)/feed/actions", () => ({
  createCommunityPostComment: vi.fn(),
  deleteCommunityPost: vi.fn(),
  shareCommunityPost: vi.fn(),
  toggleCommunityPostReaction: vi.fn(),
  toggleSavedCommunityPost: vi.fn(),
}));

function post(overrides: Partial<CommunityPostRecord> = {}): CommunityPostRecord {
  return {
    id: "post_fixture",
    user_id: "author_user",
    title: null,
    body: "A public build update.",
    visibility: "public",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    author: {
      id: "author_user",
      username: "avery.builds",
      displayName: "Avery Builder",
      initials: "AB",
      profileHref: "/profile/u/avery.builds",
      isFollowing: false,
      avatarDisplayUrl: null,
    },
    attachments: [],
    reactionCount: 2,
    commentCount: 1,
    shareCount: 0,
    reactedByCurrentUser: false,
    comments: [],
    ...overrides,
  };
}

describe("Feed social author cards", () => {
  it("links another author's avatar, name, and username to the canonical public profile and shows Follow", () => {
    const markup = renderToStaticMarkup(
      <PostList posts={[post()]} currentUserId="viewer_user" savedPostIds={[]} savedItemsAvailable />,
    );

    expect(markup).toContain('href="/profile/u/avery.builds"');
    expect(markup).toContain('aria-label="View Avery Builder&#x27;s profile"');
    expect(markup).toContain(">Avery Builder</a>");
    expect(markup).toContain(">@avery.builds</a>");
    expect(markup.match(/href="\/profile\/u\/avery\.builds"/g)).toHaveLength(3);
    expect(markup).toContain('class="feed-post-author-avatar-link"');
    expect(markup).toContain('class="feed-post-author-name-link"');
    expect(markup).toContain('class="feed-post-author-username-link"');
    expect(markup).toContain(">Follow</button>");
    expect(markup).toContain("2 reactions · 1 comment");
    expect(markup).toContain(">React</span>");
    expect(markup).toContain(">Comment</span>");
    expect(markup).toContain(">Share</span>");
  });

  it("keeps own posts routed to the owner profile and omits Follow while preserving Delete", () => {
    const ownPost = post({ user_id: "viewer_user", author: { ...post().author, id: "viewer_user", profileHref: null } });
    const markup = renderToStaticMarkup(
      <PostList posts={[ownPost]} currentUserId="viewer_user" savedPostIds={[]} savedItemsAvailable />,
    );

    expect(markup).toContain('href="/profile"');
    expect(markup).not.toContain(">Follow</button>");
    expect(markup).toContain('aria-label="Delete post"');
    const headerActions = markup.slice(markup.indexOf('<div class="feed-post-header-actions">'), markup.indexOf("</header>"));
    expect(headerActions).toContain('aria-label="Delete post"');
    expect(headerActions).not.toContain("<a");
  });

  it("keeps a legacy author without a username non-clickable instead of producing a broken profile URL", () => {
    const legacyPost = post({ author: { ...post().author, username: null, profileHref: null } });
    const markup = renderToStaticMarkup(
      <PostList posts={[legacyPost]} currentUserId="viewer_user" savedPostIds={[]} savedItemsAvailable />,
    );

    expect(markup).not.toContain("/profile/null");
    expect(markup).not.toContain("/profile/undefined");
    expect(markup).not.toContain('href="/profile/u/"');
    expect(markup).not.toContain('aria-label="View Avery Builder&#x27;s profile"');
  });
});

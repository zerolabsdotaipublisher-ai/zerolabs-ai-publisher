import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PostList } from "@/app/(app)/feed/post-list";
import type { CommunityPostRecord } from "@/app/(app)/feed/types";

const authorUserId = "77777777-7777-4777-8777-777777777777";
const legacyAuthorUserId = "88888888-8888-4888-8888-888888888888";
const legacyProfileUserId = "99999999-9999-4999-8999-999999999999";

vi.mock("@/app/(app)/feed/actions", () => ({
  createCommunityPostComment: vi.fn(),
  deleteCommunityPost: vi.fn(),
  shareCommunityPost: vi.fn(),
  toggleCommunityPostReaction: vi.fn(),
  toggleSavedCommunityPost: vi.fn(),
}));
vi.mock("@/components/profile/profile-follow-button", () => ({
  ProfileFollowButton: ({ profileUserId }: { profileUserId: string }) => <button type="button" data-follow-target={profileUserId}>Follow</button>,
}));

function post(overrides: Partial<CommunityPostRecord> = {}): CommunityPostRecord {
  return {
    id: "post_fixture",
    user_id: authorUserId,
    title: null,
    body: "A public build update.",
    visibility: "public",
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    author: {
      authorUserId,
      profileUserId: authorUserId,
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
    const ownPost = post({ user_id: "viewer_user", author: { ...post().author, authorUserId: "viewer_user", profileUserId: "viewer_user", profileHref: null } });
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

  it("keeps a legacy author without a username clickable through their durable profile route", () => {
    const legacyPost = post({
      user_id: legacyAuthorUserId,
      author: {
        ...post().author,
        authorUserId: legacyAuthorUserId,
        profileUserId: legacyProfileUserId,
        username: null,
        profileHref: `/profile/u/id/${legacyProfileUserId}`,
      },
    });
    const markup = renderToStaticMarkup(
      <PostList posts={[legacyPost]} currentUserId="viewer_user" savedPostIds={[]} savedItemsAvailable />,
    );

    expect(markup).not.toContain("/profile/null");
    expect(markup).not.toContain("/profile/undefined");
    expect(markup).toContain(`href="/profile/u/id/${legacyProfileUserId}"`);
    expect(markup.match(new RegExp(`href="/profile/u/id/${legacyProfileUserId}"`, "g"))).toHaveLength(2);
    expect(markup).toContain('class="feed-post-author-avatar-link"');
    expect(markup).toContain('class="feed-post-author-name-link"');
    expect(markup).toContain('aria-label="View Avery Builder&#x27;s profile"');
    expect(markup).toContain(`data-follow-target="${legacyProfileUserId}"`);
  });

  it("keeps obvious pointer, hover, and focus-visible affordances for all author identity links", () => {
    const styles = readFileSync(resolve(process.cwd(), "app/globals.css"), "utf8");

    expect(styles).toContain("body .feed-post-author-avatar-link");
    expect(styles).toContain("body .feed-post-author-name-link:hover");
    expect(styles).toContain("body .feed-post-author-username-link:focus-visible");
    expect(styles).toContain("cursor: pointer");
  });
});
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

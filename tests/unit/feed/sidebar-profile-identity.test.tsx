import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FeedSidebarProfileIdentity } from "@/app/(app)/feed/sidebar-profile-identity";

describe("FeedSidebarProfileIdentity", () => {
  it("links the signed-in avatar and name to the owner profile with distinct accessible controls", () => {
    const markup = renderToStaticMarkup(
      <FeedSidebarProfileIdentity
        href="/profile"
        displayName="Avery Builder"
        email="avery@example.com"
        avatarDisplayUrl={null}
        initials="AB"
      />,
    );

    expect(markup.match(/href="\/profile"/g)).toHaveLength(2);
    expect(markup).toContain('aria-label="View your profile"');
    expect(markup).toContain('class="feed-profile-avatar-link"');
    expect(markup).toContain('class="feed-profile-name-link"');
    expect(markup).toContain(">Avery Builder</a>");
  });
});

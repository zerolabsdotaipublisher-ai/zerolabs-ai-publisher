import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PublicWebsiteList } from "@/app/(app)/feed/website-list";

describe("PublicWebsiteList", () => {
  it("makes the entire public website card a safe link to its live site", () => {
    const markup = renderToStaticMarkup(
      <PublicWebsiteList
        websites={[{
          id: "site_fixture",
          site_title: "Nimbus Studio",
          visibility: "public",
          generated_at: "2026-01-01T00:00:00.000Z",
          updated_at: "2026-01-02T00:00:00.000Z",
          status: "published",
        }]}
      />,
    );

    expect(markup).toContain('class="feed-website-card feed-website-card-link"');
    expect(markup).toContain('href="/site/site_fixture"');
    expect(markup).toContain('target="_blank"');
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain('aria-label="View Nimbus Studio"');
    expect(markup).toContain("View site");
    expect(markup.match(/href="\/site\/site_fixture"/g)).toHaveLength(1);
  });
});

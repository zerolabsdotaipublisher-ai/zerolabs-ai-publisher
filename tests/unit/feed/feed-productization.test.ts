import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readSource = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("community feed productization", () => {
  const page = readSource("app/(app)/feed/page.tsx");
  const composer = readSource("app/(app)/feed/post-composer.tsx");
  const navigation = readSource("components/app/app-navigation.tsx");
  const websiteList = readSource("app/(app)/feed/website-list.tsx");

  it("keeps the three feed areas and responsive layout hooks available", () => {
    expect(page).toContain("feed-community-panel");
    expect(page).toContain("feed-main");
    expect(page).toContain("feed-explore-panel");
    expect(page).toContain("Community posts");
    expect(page).toContain("Public Websites");
  });

  it("keeps the posting flow controls, optional title, and semantic labels", () => {
    for (const label of ["Text", "Image", "Code", "Project", "Docs", "GIF", "Video", "Website"]) {
      expect(composer).toContain(`label: \"${label}\"`);
    }

    expect(composer).toContain('name="post_type"');
    expect(composer).toContain('name="title"');
    expect(composer).toContain("(optional)");
    expect(composer).toContain('name="body"');
    expect(composer).toContain('name="visibility"');
    expect(composer).toContain('type="submit"');
    expect(composer).toContain("createCommunityPost(formData)");
  });

  it("preserves the app navigation destinations and public website action", () => {
    for (const label of ["Dashboard", "Feed", "Insights", "Generate Website", "Profile"]) {
      expect(navigation).toContain(`label: \"${label}\"`);
    }

    expect(navigation).toContain("SiteThemeToggle");
    expect(navigation).toContain("SignOutButton");
    expect(websiteList).toContain("View site");
    expect(websiteList).toContain("routes.liveSite(site.id)");
  });
});

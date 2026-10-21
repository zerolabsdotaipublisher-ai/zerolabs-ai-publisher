import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const readSource = (path: string) => readFileSync(resolve(root, path), "utf8");

describe("community feed productization", () => {
  const page = readSource("app/(app)/feed/page.tsx");
  const composer = readSource("app/(app)/feed/post-composer.tsx");
  const postList = readSource("app/(app)/feed/post-list.tsx");
  const queries = readSource("app/(app)/feed/queries.ts");
  const navigation = readSource("components/app/app-navigation.tsx");
  const routes = readSource("config/routes.ts");
  const websiteList = readSource("app/(app)/feed/website-list.tsx");

  it("keeps the three feed areas and responsive layout hooks available", () => {
    expect(page).toContain("feed-community-panel");
    expect(page).toContain("feed-main");
    expect(page).toContain("feed-explore-panel");
    expect(page).toContain("Community posts");
    expect(page).toContain("Public Websites");
  });

  it("keeps all post-type controls and the Text posting flow available", () => {
    for (const label of ["Text", "Image", "Code", "Project", "Docs", "GIF", "Video", "Website"]) {
      expect(composer).toContain(`label: \"${label}\"`);
    }

    expect(composer).toContain('{ value: "text", label: "Text", status: "Ready", statusClass: "is-ready", isAvailable: true }');
    expect(composer).toContain('name="post_type"');
    expect(composer).toContain('name="title"');
    expect(composer).toContain("(optional)");
    expect(composer).toContain('name="body"');
    expect(composer).toContain('name="visibility"');
  });

  it("keeps the Post submit action wired to the Text post server action", () => {
    expect(composer).toContain('type="submit"');
    expect(composer).toContain("createCommunityPost(formData)");
    expect(composer).toContain("Post created.");
  });

  it("keeps unavailable attachment and website post types disabled with clear wording", () => {
    for (const label of ["image", "code", "project", "docs", "gif", "video", "website"]) {
      expect(composer).toContain(`value: "${label}"`);
    }

    expect(composer).toContain('status: "Unavailable"');
    expect(composer).toContain("isAvailable: false");
    expect(composer).toContain("disabled={isPending || !isAvailable}");
    expect(composer).toContain("aria-pressed={isAvailable ? postType === value : undefined}");
    expect(composer).toContain("onClick={isAvailable ? () => setPostType(value) : undefined}");
    expect(composer).toContain("Attachment and website sharing are not configured for this workspace.");
    expect(composer).not.toContain('name="attachment"');
    expect(composer).not.toContain('name="project_url"');
    expect(composer).not.toContain('name="website_id"');
    expect(page).toContain("<PostComposer />");
    expect(page).not.toContain("getPublicWebsitesForOwner(user.id)");
  });

  it("keeps top navigation routes valid", () => {
    for (const [routeName, path] of [
      ["dashboard", "/dashboard"],
      ["feed", "/feed"],
      ["insights", "/insights"],
      ["generateWebsite", "/generate"],
      ["profile", "/profile"],
    ]) {
      expect(navigation).toContain(`href: routes.${routeName}`);
      expect(routes).toContain(`${routeName}: "${path}"`);
    }

    expect(navigation).toContain("SiteThemeToggle");
    expect(navigation).toContain("SignOutButton");
  });

  it("keeps the public website action on a valid live route", () => {
    expect(websiteList).toContain("View site");
    expect(websiteList).toContain("routes.liveSite(site.id)");
    expect(routes).toContain('liveSite: (id: string) => `/site/${id}`');
    expect(postList).toContain("routes.liveSite(websiteId)");
    expect(postList).not.toContain("routes.previewSite(websiteId)");
  });

  it("disables post actions whose backing Feed capability is unavailable", () => {
    expect(page).toContain("savedItemsAvailable={savedItemsResult.isAvailable}");
    expect(queries).toContain("isAvailable: false");
    expect(postList).toContain("disabled={post.commentCount === null}");
    expect(postList).toContain("disabled={isBusy || !savedItemsAvailable}");
  });
});

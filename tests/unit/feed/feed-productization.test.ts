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
  const sharedContentPreview = readSource("components/feed/shared-content-preview.tsx");
  const nextConfig = readSource("next.config.ts");

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

    expect(composer).toContain('const [postType, setPostType] = useState<CommunityPostType>("text")');
    expect(composer).toContain('aria-pressed={isSelected}');
    expect(composer).toContain('feed-type-pill ${isSelected ? "is-active" : ""}');
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

  it("enables attachment and website post types with their backed input controls", () => {
    for (const label of ["image", "code", "project", "docs", "gif", "video", "website"]) {
      expect(composer).toContain(`value: "${label}"`);
    }

    expect(composer).toContain('isWebsiteUnavailable');
    expect(composer).toContain('disabled={isPending || !isAvailable}');
    expect(composer).toContain('name="attachment"');
    expect(composer).toContain('name="project_url"');
    expect(composer).toContain('name="website_id"');
    expect(composer).toContain('encType="multipart/form-data"');
    expect(composer).toContain("event.currentTarget.setCustomValidity(validationError ?? \"\")");
    expect(nextConfig).toContain('bodySizeLimit: "4.4mb"');
    expect(page).toContain("getPublicWebsitesForOwner(user.id)");
    expect(page).toContain("<PostComposer websites={shareableWebsites} />");
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
    expect(postList).toContain("SharedContentPreview");
    expect(sharedContentPreview).toContain("routes.liveSite(websiteId)");
    expect(sharedContentPreview).not.toContain("routes.previewSite(websiteId)");
  });

  it("disables post actions whose backing Feed capability is unavailable", () => {
    expect(page).toContain("savedItemsAvailable={savedItemsResult.isAvailable}");
    expect(queries).toContain("isAvailable: false");
    expect(postList).toContain("disabled={post.commentCount === null}");
    expect(postList).toContain("disabled={isBusy || !savedItemsAvailable}");
  });

  it("keeps the composer safe while a post is submitting", () => {
    expect(composer).toContain('const isSubmittingRef = useRef(false)');
    expect(composer).toContain('if (isSubmittingRef.current) return;');
    expect(composer).toContain('if (fileError) {');
    expect(composer).toContain('isSubmittingRef.current = true;');
    expect(composer).toContain('{isPending ? "Posting..." : "Post"}');
    expect(composer).toContain('disabled={isPending || Boolean(fileError)}');
    expect(composer).toContain('setError("Unable to create your post. Please try again.")');
  });
});

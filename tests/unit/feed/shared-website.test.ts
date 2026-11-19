import { describe, expect, it } from "vitest";
import {
  getSharedWebsiteId,
  resolveSharedWebsiteAttachment,
  type SharedWebsiteRecord,
} from "@/app/(app)/feed/shared-website";
import type { CommunityPostAttachment } from "@/app/(app)/feed/types";

function attachment(overrides: Partial<CommunityPostAttachment> = {}): CommunityPostAttachment {
  return {
    id: "attachment_fixture",
    post_id: "post_fixture",
    attachment_type: "project",
    storage_path: "website:website_fixture",
    file_name: "Shared website snapshot",
    metadata: { website_id: "website_fixture", kind: "generated-website" },
    ...overrides,
  };
}

function website(overrides: Partial<SharedWebsiteRecord> = {}): SharedWebsiteRecord {
  return {
    id: "website_fixture",
    site_title: "Harborview Home Services",
    visibility: "public",
    status: "published",
    structure: {
      publication: {
        liveUrl: "https://harborview.example",
        livePath: "/site/website_fixture",
      },
    },
    ...overrides,
  };
}

describe("shared Feed website destinations", () => {
  it("uses the current canonical published URL and current title for a public published website", () => {
    expect(resolveSharedWebsiteAttachment(attachment(), website())).toEqual({
      id: "website_fixture",
      title: "Harborview Home Services",
      href: "https://harborview.example",
      isExternal: true,
    });
  });

  it("uses the publishing system's supported internal live path when no canonical URL is stored", () => {
    const result = resolveSharedWebsiteAttachment(attachment(), website({
      structure: { publication: { livePath: "/site/website_fixture/about" } },
    }));

    expect(result).toMatchObject({ href: "/site/website_fixture/about", isExternal: false });
  });

  it("falls back to the canonical public-site route rather than a reconstructed title-based URL", () => {
    const result = resolveSharedWebsiteAttachment(attachment(), website({ structure: {} }));

    expect(result).toMatchObject({ href: "/site/website_fixture", isExternal: false });
    expect(result?.href).not.toContain("Harborview");
  });

  it("never exposes editor, dashboard, or unsafe URL values from website data", () => {
    const result = resolveSharedWebsiteAttachment(attachment(), website({
      structure: {
        publication: {
          liveUrl: "javascript:alert(1)",
          livePath: "/editor/website_fixture",
        },
      },
    }));

    expect(result).toMatchObject({ href: "/site/website_fixture", isExternal: false });
  });

  it("keeps private, deleted, missing, and unshared draft websites unavailable to ordinary Feed viewers", () => {
    expect(resolveSharedWebsiteAttachment(attachment(), website({ visibility: "private" }))).toMatchObject({ href: null });
    expect(resolveSharedWebsiteAttachment(attachment(), website({ status: "draft" }))).toMatchObject({ href: null });
    expect(resolveSharedWebsiteAttachment(attachment(), website({ status: "deleted" }), { isPublicFeedPost: true })).toMatchObject({ href: null });
    expect(resolveSharedWebsiteAttachment(attachment(), website({ deleted_at: "2026-11-18T00:00:00.000Z" }))).toMatchObject({ href: null });
    expect(resolveSharedWebsiteAttachment(attachment(), null)).toMatchObject({ href: null });
  });

  it("uses the internal design route for a public website deliberately shared through a public Feed post", () => {
    const result = resolveSharedWebsiteAttachment(
      attachment(),
      website({ status: "draft", structure: {} }),
      { isPublicFeedPost: true },
    );

    expect(result).toEqual({
      id: "website_fixture",
      title: "Harborview Home Services",
      href: "/site/website_fixture",
      isExternal: false,
      isFeedSharedDesign: true,
    });
  });

  it("routes an owner's no-longer-public shared site to its authenticated design preview", () => {
    const result = resolveSharedWebsiteAttachment(
      attachment(),
      website({ visibility: "private", user_id: "viewer_fixture" }),
      { currentUserId: "viewer_fixture" },
    );

    expect(result).toMatchObject({
      href: "/preview/website_fixture",
      isExternal: false,
      isOwnerPreview: true,
    });
  });

  it("reads the metadata website ID, with the established storage sentinel as a legacy fallback", () => {
    expect(getSharedWebsiteId(attachment())).toBe("website_fixture");
    expect(getSharedWebsiteId(attachment({ metadata: null }))).toBe("website_fixture");
    expect(getSharedWebsiteId(attachment({ storage_path: "link:https://example.com", metadata: null }))).toBeNull();
  });
});

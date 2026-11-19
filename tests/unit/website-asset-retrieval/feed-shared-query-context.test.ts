import { describe, expect, it } from "vitest";
import type { WebsiteStructure } from "@/lib/ai/structure";
import { appendWebsiteAssetQueryContext, withWebsiteAssetQueryContext } from "@/lib/website-asset-retrieval/urls";

const assetPath = "/api/website-assets/asset_fixture";

describe("Feed-shared website asset query context", () => {
  it("binds an asset URL to the specific Feed-shared design and converts it to the render endpoint", () => {
    expect(appendWebsiteAssetQueryContext(assetPath, { feedSharedWebsiteId: "website_fixture" }))
      .toBe("/api/website-assets/asset_fixture/url?feedSharedWebsiteId=website_fixture");
  });

  it("rewrites only website asset URLs in the rendered structure without mutating the source design", () => {
    const structure = {
      seo: { ogImage: assetPath },
      pages: [{
        seo: { openGraph: { image: assetPath } },
        sections: [{
          content: { image: assetPath, publicImage: "https://images.example.com/public.png" },
          components: [{ props: { image: assetPath } }],
        }],
      }],
    } as unknown as WebsiteStructure;

    const result = withWebsiteAssetQueryContext(structure, { feedSharedWebsiteId: "website_fixture" });
    const expected = `${assetPath}/url?feedSharedWebsiteId=website_fixture`;

    expect(result).not.toBe(structure);
    expect(result.seo.ogImage).toBe(expected);
    expect(result.pages[0]?.seo.openGraph?.image).toBe(expected);
    expect((result.pages[0]?.sections[0]?.content as { image: string }).image).toBe(expected);
    expect((result.pages[0]?.sections[0]?.content as { publicImage: string }).publicImage).toBe("https://images.example.com/public.png");
    expect((result.pages[0]?.sections[0]?.components?.[0]?.props as { image: string }).image).toBe(expected);
    expect(structure.seo.ogImage).toBe(assetPath);
  });
});

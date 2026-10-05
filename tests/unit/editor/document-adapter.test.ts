import { describe, expect, it } from "vitest";
import { adaptWebsiteStructureToEditorDocument, validateEditorDocument } from "@/lib/editor/document";
import {
  createHiddenReorderedSiteFixture,
  createLegacyUnknownSectionFixture,
  createMultiPageSiteFixture,
  createStandardMarketingSiteFixture,
} from "@/tests/fixtures/editor-document";

describe("WebsiteStructure -> EditorDocument adapter", () => {
  it("is deterministic, preserves input, and produces a structurally valid document", () => {
    const structure = createStandardMarketingSiteFixture();
    const before = structuredClone(structure);

    const first = adaptWebsiteStructureToEditorDocument(structure);
    const second = adaptWebsiteStructureToEditorDocument(structure);

    expect(first).toEqual(second);
    expect(structure).toEqual(before);
    expect(validateEditorDocument(first)).toEqual([]);
  });

  it("preserves page ordering, routes, SEO, CTA content, and media intent", () => {
    const document = adaptWebsiteStructureToEditorDocument(createMultiPageSiteFixture());
    const home = document.pages.find((page) => page.path === "/")!;
    const about = document.pages.find((page) => page.path === "/about")!;
    const heroNode = document.nodes[document.nodes[home.rootNodeIds[0]].slots.default.childIds[0]];

    expect(document.pages.map((page) => page.id)).toEqual([home.id, about.id]);
    expect(home.name).toBe("Home");
    expect(about.name).toBe("About SprintBoard");
    expect(about.seo.canonicalUrl).toBe("https://sprintboard.example/about");
    expect(document.site.seo.canonicalBaseUrl).toBe("https://sprintboard.example");
    expect(heroNode.props.content).toMatchObject({
      primaryCta: "Start free trial",
      ctaHref: "/contact",
    });
    expect(Object.values(document.assets)).toContainEqual(
      expect.objectContaining({
        url: "https://cdn.example.test/sprintboard-hero.png",
        alt: "SprintBoard planning dashboard",
      }),
    );
  });

  it("preserves ordered hidden sections without render normalization", () => {
    const document = adaptWebsiteStructureToEditorDocument(createHiddenReorderedSiteFixture());
    const home = document.pages.find((page) => page.path === "/")!;
    const childNodes = document.nodes[home.rootNodeIds[0]].slots.default.childIds.map((id) => document.nodes[id]);

    expect(childNodes.map((node) => node.legacy?.sourceId)).toEqual([
      "sec_hero_landing_001",
      "sec_services_landing_001",
      "sec_cta_landing_001",
    ]);
    expect(childNodes[1].visibility).toEqual({ base: false });
    expect(document.nodes[home.rootNodeIds[0]].slots.default.childIds).not.toContain("sec_testimonials_landing_001");
  });

  it("resolves page and section navigation to stable references where possible", () => {
    const document = adaptWebsiteStructureToEditorDocument(createMultiPageSiteFixture());
    const primary = document.navigation.menus.find((menu) => menu.id === "primary")!;
    const home = document.pages.find((page) => page.path === "/")!;
    const servicesNode = Object.values(document.nodes).find(
      (node) => node.legacy?.sourceId === "sec_services_landing_001",
    )!;

    expect(primary.items[0].target).toEqual({ kind: "page", pageId: home.id });
    expect(primary.items[1].target).toEqual({
      kind: "page",
      pageId: "page_about_landing_001",
    });
    expect(primary.items[2].target).toEqual({
      kind: "node",
      nodeId: servicesNode.id,
      pageId: home.id,
    });
  });

  it("keeps unsupported legacy sections explicit instead of dropping their content", () => {
    const document = adaptWebsiteStructureToEditorDocument(createLegacyUnknownSectionFixture());
    const legacyNode = Object.values(document.nodes).find(
      (node) => node.legacy?.sourceId === "sec_legacy_announcement_001",
    );

    expect(legacyNode).toMatchObject({
      type: "legacy.section.announcement",
      kind: "legacy",
      visibility: { base: false },
      legacy: {
        sourceType: "announcement",
        unsupported: true,
      },
      props: {
        content: {
          headline: "Legacy announcement",
          action: { label: "Read more", href: "/legacy" },
        },
      },
    });
  });

  it("uses stable IDs across repeated adaptations", () => {
    const structure = createStandardMarketingSiteFixture();
    const first = adaptWebsiteStructureToEditorDocument(structure);
    const second = adaptWebsiteStructureToEditorDocument(structure);

    expect(Object.keys(first.nodes).sort()).toEqual(Object.keys(second.nodes).sort());
    expect(first.pages.map((page) => page.rootNodeIds)).toEqual(second.pages.map((page) => page.rootNodeIds));
  });
});

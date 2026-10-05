import { describe, expect, it } from "vitest";
import { validateWebsiteStructure } from "@/lib/ai/structure/schemas";
import type { WebsiteStructure } from "@/lib/ai/structure/types";
import {
  adaptWebsiteStructureToEditorDocument,
  getEditorDocumentProjectabilityIssues,
  projectEditorDocumentNavigation,
  projectEditorDocumentSeo,
  projectEditorDocumentToWebsiteStructure,
  trustedWebsiteStructureState,
  type EditorProjectionResult,
} from "@/lib/editor/document";
import {
  atomicEditorSaveHttpStatus,
  type AtomicEditorSaveOutcome,
} from "@/lib/editor/persistence-contract";
import {
  assertWebsiteVersionSnapshot,
  createCanonicalWebsiteVersionSnapshot,
  isCanonicalWebsiteVersionSnapshot,
  isLegacyWebsiteVersionSnapshot,
} from "@/lib/versions/snapshot-contract";
import type { WebsiteVersionSnapshot } from "@/lib/versions/types";
import {
  createHiddenReorderedSiteFixture,
  createLegacyUnknownSectionFixture,
  createMultiPageSiteFixture,
  createStandardMarketingSiteFixture,
} from "@/tests/fixtures/editor-document";

function projected<T>(result: EditorProjectionResult<T>): T {
  if (!result.ok) {
    throw new Error(result.issues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
  }
  return result.value;
}

function versionable(structure: WebsiteStructure): WebsiteStructure {
  return {
    ...structuredClone(structure),
    pages: structure.pages.map((page, index) => ({
      ...structuredClone(page),
      depth: page.depth ?? 0,
      priority: page.priority ?? index,
      visible: page.visible ?? true,
      navigation: page.navigation ?? {
        includeInHeader: true,
        includeInFooter: true,
        includeInSidebar: false,
      },
    })),
  };
}

describe("EditorDocument compatibility projections", () => {
  it("projects deterministically without mutating the document or trusted server state", () => {
    const structure = createStandardMarketingSiteFixture();
    const document = adaptWebsiteStructureToEditorDocument(structure);
    const trusted = trustedWebsiteStructureState(structure);
    const documentBefore = structuredClone(document);
    const trustedBefore = structuredClone(trusted);

    const first = projected(projectEditorDocumentToWebsiteStructure(document, trusted));
    const second = projected(projectEditorDocumentToWebsiteStructure(document, trusted));

    expect(first).toEqual(second);
    expect(document).toEqual(documentBefore);
    expect(trusted).toEqual(trustedBefore);
    expect(first.id).toBe(structure.id);
    expect(first.userId).toBe(structure.userId);
    expect(first.sourceInput).toEqual(structure.sourceInput);
    expect(first.status).toBe(structure.status);
    expect(first.version).toBe(structure.version);
    expect(first.generatedAt).toBe(structure.generatedAt);
    expect(first.updatedAt).toBe(structure.updatedAt);
    expect(validateWebsiteStructure(first)).toEqual([]);
  });

  it("round-trips supported adapter-derived pages, sections, SEO, CTA, media, and components", () => {
    const original = createMultiPageSiteFixture();
    const document = adaptWebsiteStructureToEditorDocument(original);
    const compatibility = projected(projectEditorDocumentToWebsiteStructure(document, trustedWebsiteStructureState(original)));

    expect(compatibility.siteTitle).toBe(original.siteTitle);
    expect(compatibility.tagline).toBe(original.tagline);
    expect(compatibility.pages.map((page) => [page.id, page.slug, page.title, page.order])).toEqual(
      [...original.pages]
        .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
        .map((page) => [page.id, page.slug, page.title, page.order]),
    );
    expect(compatibility.pages.map((page) => page.seo)).toEqual(
      [...original.pages]
        .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
        .map((page) => page.seo),
    );
    expect(compatibility.seo).toEqual(original.seo);
    expect(compatibility.navigation.primary).toEqual(original.navigation.primary);
    expect(compatibility.navigation.footer).toEqual(original.navigation.footer);

    const hero = compatibility.pages[0].sections.find((section) => section.type === "hero")!;
    expect(hero.content).toMatchObject({
      primaryCta: "Start free trial",
      ctaHref: "/contact",
      image: {
        src: "https://cdn.example.test/sprintboard-hero.png",
        alt: "SprintBoard planning dashboard",
      },
    });
    expect(hero.components).toEqual([
      {
        id: "cmp_hero_supporting_copy",
        type: "paragraph",
        props: { text: "Planning clarity for remote teams." },
      },
    ]);
  });

  it("preserves render order and hidden state for reordered sections", () => {
    const structure = createHiddenReorderedSiteFixture();
    const document = adaptWebsiteStructureToEditorDocument(structure);
    const compatibility = projected(projectEditorDocumentToWebsiteStructure(document, trustedWebsiteStructureState(structure)));
    const sections = compatibility.pages[0].sections;

    expect(sections.map((section) => section.id)).toEqual([
      "sec_hero_landing_001",
      "sec_services_landing_001",
      "sec_cta_landing_001",
    ]);
    expect(sections.map((section) => section.visible)).toEqual([true, false, true]);
    expect(sections.map((section) => section.order)).toEqual([10, 20, 30]);
  });

  it("preserves existing unknown legacy sections instead of discarding them", () => {
    const structure = createLegacyUnknownSectionFixture();
    const document = adaptWebsiteStructureToEditorDocument(structure);
    const compatibility = projected(projectEditorDocumentToWebsiteStructure(document, trustedWebsiteStructureState(structure)));
    const legacy = compatibility.pages[0].sections.find((section) => section.id === "sec_legacy_announcement_001");

    expect(legacy).toMatchObject({
      id: "sec_legacy_announcement_001",
      type: "announcement",
      visible: false,
      content: {
        headline: "Legacy announcement",
        action: { label: "Read more", href: "/legacy" },
      },
    });
  });

  it("rejects nested generic layout nodes instead of silently flattening them", () => {
    const structure = createStandardMarketingSiteFixture();
    const document = adaptWebsiteStructureToEditorDocument(structure);
    const root = document.nodes[document.pages[0].rootNodeIds[0]];
    document.nodes["node_generic_container"] = {
      id: "node_generic_container",
      type: "layout.container",
      kind: "container",
      props: {},
      visibility: { base: true },
      slots: { default: { name: "default", childIds: [] } },
    };
    root.slots.default.childIds.push("node_generic_container");

    const result = projectEditorDocumentToWebsiteStructure(document, trustedWebsiteStructureState(structure));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: "unprojectable_node",
            nodeId: "node_generic_container",
          }),
        ]),
      );
    }
  });

  it("rejects responsive visibility and global overrides that WebsiteStructure cannot represent", () => {
    const structure = createStandardMarketingSiteFixture();
    const document = adaptWebsiteStructureToEditorDocument(structure);
    const header = document.nodes[document.globals.header!.nodeId];
    document.pages[0].visibility.mobile = false;
    header.props.siteName = "A conflicting global name";

    const issues = getEditorDocumentProjectabilityIssues(document, trustedWebsiteStructureState(structure));

    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "unprojectable_visibility" }),
        expect.objectContaining({ code: "unprojectable_global", nodeId: header.id }),
      ]),
    );
  });
});

describe("EditorDocument navigation projection", () => {
  it("resolves typed page targets to changed paths, retains safe external URLs, and keeps menu visibility/order", () => {
    const structure = createMultiPageSiteFixture();
    const document = adaptWebsiteStructureToEditorDocument(structure);
    const about = document.pages.find((page) => page.id === "page_about_landing_001")!;
    about.path = "/company";
    const primary = document.navigation.menus.find((menu) => menu.id === "primary")!;
    primary.items[0].visible = false;

    const navigation = projected(projectEditorDocumentNavigation(document));
    const header = navigation.menus!.find((menu) => menu.id === "primary")!;

    expect(header.items.map((item) => [item.label, item.href, item.visible, item.order])).toEqual([
      ["Home", "/", false, 0],
      ["About", "/company", true, 1],
      ["Features", "#services", true, 2],
    ]);
    expect(navigation.primary).toEqual([
      { label: "About", href: "/company", pageId: "page_about_landing_001" },
      { label: "Features", href: "#services" },
    ]);
    expect(navigation.hierarchy?.nodes.find((node) => node.pageId === about.id)?.path).toBe("/company");
    expect(document.navigation.menus[0].items[2].target).toEqual({
      kind: "node",
      nodeId: expect.any(String),
      pageId: structure.pages[0].id,
    });
  });

  it("preserves external navigation destinations", () => {
    const structure = createStandardMarketingSiteFixture();
    const document = adaptWebsiteStructureToEditorDocument(structure);
    const navigation = projected(projectEditorDocumentNavigation(document));

    expect(navigation.primary).toContainEqual({
      label: "Contact",
      href: "https://sprintboard.example/contact",
      external: true,
    });
  });
});

describe("EditorDocument SEO and version snapshot contracts", () => {
  it("projects deterministic site and page SEO artifact rows with canonical Open Graph metadata", () => {
    const structure = createMultiPageSiteFixture();
    const document = adaptWebsiteStructureToEditorDocument(structure);
    const about = document.pages.find((page) => page.id === "page_about_landing_001")!;
    about.seo.openGraph = {
      title: "About SprintBoard on social",
      description: "Meet the team behind SprintBoard.",
      type: "website",
      url: "https://sprintboard.example/about",
      image: "https://cdn.example.test/about-og.png",
    };

    const first = projected(projectEditorDocumentSeo(document, trustedWebsiteStructureState(structure)));
    const second = projected(projectEditorDocumentSeo(document, trustedWebsiteStructureState(structure)));
    const aboutRow = first.rows.find((row) => row.page_slug === "/about")!;

    expect(first).toEqual(second);
    expect(first.package.site.canonicalBaseUrl).toBe("https://sprintboard.example");
    expect(first.package.pages.find((page) => page.pageSlug === "/about")).toMatchObject({
      canonicalUrl: "https://sprintboard.example/about",
      openGraph: about.seo.openGraph,
    });
    expect(aboutRow.id).toBe(`${structure.id}:L2Fib3V0`);
    expect(aboutRow.metadata_json).toMatchObject({
      title: "About SprintBoard",
      openGraph: about.seo.openGraph,
    });
  });

  it("creates v2 snapshots while retaining v1 recognition and restore compatibility", () => {
    const structure = versionable(createStandardMarketingSiteFixture());
    const document = adaptWebsiteStructureToEditorDocument(structure);
    const v1: WebsiteVersionSnapshot = {
      schemaVersion: 1,
      capturedAt: structure.updatedAt,
      structure,
    };
    const v2 = createCanonicalWebsiteVersionSnapshot({
      structure,
      canonicalDocument: document,
      editorRevision: 7,
      capturedAt: "2026-10-05T09:00:00.000Z",
    });

    expect(isLegacyWebsiteVersionSnapshot(v1)).toBe(true);
    expect(isCanonicalWebsiteVersionSnapshot(v1)).toBe(false);
    expect(assertWebsiteVersionSnapshot(v1)).toEqual(structure);
    expect(isCanonicalWebsiteVersionSnapshot(v2)).toBe(true);
    expect(v2).toMatchObject({
      schemaVersion: 2,
      editorRevision: 7,
      canonicalDocumentSchemaVersion: 1,
      structure,
      canonicalDocument: document,
    });
    expect(assertWebsiteVersionSnapshot(v2)).toEqual(structure);
  });
});

describe("future atomic Save Draft contract", () => {
  it("maps stale revisions to HTTP 409 and projectability failures to HTTP 422", () => {
    const stale: AtomicEditorSaveOutcome = {
      kind: "stale_revision",
      code: "stale_revision",
      message: "A newer draft exists.",
      current: { revision: 8, version: 3, updatedAt: "2026-10-05T09:00:00.000Z" },
    };
    const unprojectable: AtomicEditorSaveOutcome = {
      kind: "validation_failed",
      code: "unprojectable_document",
      message: "Nested containers are not available yet.",
      issues: [
        {
          code: "unprojectable_layout",
          path: "nodes.node_generic_container",
          message: "Nested containers are deferred.",
          nodeId: "node_generic_container",
        },
      ],
    };

    expect(atomicEditorSaveHttpStatus(stale)).toBe(409);
    expect(atomicEditorSaveHttpStatus(unprojectable)).toBe(422);
  });
});

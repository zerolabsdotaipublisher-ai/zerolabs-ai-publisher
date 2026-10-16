import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  adaptWebsiteStructureToEditorDocument,
  type EditorDocument,
  type EditorNode,
} from "@/lib/editor/document";
import {
  EditorDocumentRenderer,
  getEditorDocumentPageMetadata,
} from "@/components/generated-site/document-renderer";
import {
  createHiddenReorderedSiteFixture,
  createMultiPageSiteFixture,
  createStandardMarketingSiteFixture,
  createVisibleLegacyUnknownSectionFixture,
} from "@/tests/fixtures/editor-document";

function render(document: EditorDocument, pagePath = "/"): string {
  return renderToStaticMarkup(<EditorDocumentRenderer document={document} pagePath={pagePath} />);
}

function addNode(document: EditorDocument, node: EditorNode, parentId: string): EditorDocument {
  const parent = document.nodes[parentId];
  return {
    ...document,
    nodes: {
      ...document.nodes,
      [parentId]: {
        ...parent,
        slots: {
          ...parent.slots,
          default: {
            ...parent.slots.default,
            childIds: [...parent.slots.default.childIds, node.id],
          },
        },
      },
      [node.id]: node,
    },
  };
}

describe("EditorDocumentRenderer", () => {
  it("renders adapted site identity, ordered sections, navigation, CTA, media, and renderer metadata", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const html = render(document);
    const heroIndex = html.indexOf('data-legacy-source-id="sec_hero_landing_001"');
    const servicesIndex = html.indexOf('data-legacy-source-id="sec_services_landing_001"');

    expect(html).toContain("SprintBoard");
    expect(html).toContain("The planning tool remote product teams actually use.");
    expect(html).toContain("Start free trial");
    expect(html).toContain('href="/contact"');
    expect(html).toContain('src="https://cdn.example.test/sprintboard-hero.png"');
    expect(html).toContain("SprintBoard planning dashboard");
    expect(html).toContain("Features");
    expect(html).toContain('href="#services"');
    expect(html).toContain('href="?page=%2F"');
    expect(heroIndex).toBeGreaterThan(-1);
    expect(servicesIndex).toBeGreaterThan(heroIndex);

    expect(getEditorDocumentPageMetadata(document, document.pages[0])).toMatchObject({
      title: "SprintBoard | Sprint Planning for Remote Teams",
      canonicalUrl: "https://sprintboard.example/",
      openGraph: { title: "SprintBoard for remote teams" },
    });
  });

  it("preserves hidden and reordered section intent without render normalization", () => {
    const html = render(adaptWebsiteStructureToEditorDocument(createHiddenReorderedSiteFixture()));

    expect(html).toContain('data-legacy-source-id="sec_hero_landing_001"');
    expect(html).toContain('data-legacy-source-id="sec_cta_landing_001"');
    expect(html).not.toContain('data-legacy-source-id="sec_services_landing_001"');
    expect(html.indexOf('data-legacy-source-id="sec_hero_landing_001"')).toBeLessThan(
      html.indexOf('data-legacy-source-id="sec_cta_landing_001"'),
    );
  });

  it("renders selected routes and typed page navigation references", () => {
    const document = adaptWebsiteStructureToEditorDocument(createMultiPageSiteFixture());
    const html = render(document, "/about");

    expect(html).toContain('data-page-path="/about"');
    expect(html).toContain("About SprintBoard");
    expect(html).toContain('href="?page=%2Fabout"');
  });

  it("renders generic registry nodes recursively and never executes unsafe button URLs", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const rootId = document.pages[0].rootNodeIds[0];
    const container: EditorNode = {
      id: "container_editor_test",
      type: "layout.container",
      kind: "container",
      props: {},
      visibility: { base: true, mobile: false },
      styles: { width: "wide", spacing: "spacious" },
      slots: { default: { name: "default", childIds: ["heading_editor_test", "button_editor_test", "image_editor_test"] } },
    };
    const withContainer = addNode(document, container, rootId);
    const withHeading = addNode(withContainer, {
      id: "heading_editor_test",
      type: "component.heading",
      kind: "component",
      props: { text: "Registry heading", level: 3 },
      visibility: { base: true },
      slots: {},
    }, "container_editor_test");
    const withButton = addNode(withHeading, {
      id: "button_editor_test",
      type: "component.button",
      kind: "component",
      props: { label: "Unsafe URL", href: "javascript:alert(1)" },
      visibility: { base: true },
      slots: {},
    }, "container_editor_test");
    const complete = addNode(withButton, {
      id: "image_editor_test",
      type: "component.image",
      kind: "component",
      props: { src: "https://cdn.example.test/generic-image.png", alt: "Generic image" },
      visibility: { base: true },
      slots: {},
    }, "container_editor_test");

    const withAssetReference: EditorDocument = {
      ...complete,
      assets: {
        ...complete.assets,
        draft_image_asset: {
          id: "draft_image_asset",
          source: "external",
          url: "https://cdn.example.test/referenced-image.png",
          alt: "Referenced image",
        },
      },
      nodes: {
        ...complete.nodes,
        image_editor_test: {
          ...complete.nodes.image_editor_test,
          props: { ...complete.nodes.image_editor_test.props, src: "draft_image_asset", alt: "Referenced image" },
        },
      },
    };
    const html = render(withAssetReference);

    expect(html).toContain("Registry heading");
    expect(html).toContain("Unsafe URL");
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('src="https://cdn.example.test/referenced-image.png"');
    expect(html).toContain('alt="Referenced image"');
    expect(html).toContain("gs-document-hidden-mobile");
    expect(html.indexOf("Registry heading")).toBeLessThan(html.indexOf("Unsafe URL"));
  });

  it("uses the safe legacy fallback instead of discarding visible custom content", () => {
    const html = render(adaptWebsiteStructureToEditorDocument(createVisibleLegacyUnknownSectionFixture()));

    expect(html).toContain('data-legacy-node="legacy.section.announcement"');
    expect(html).toContain("Legacy announcement");
    expect(html).toContain("This content must not disappear during adaptation.");
    expect(html).toContain('href="/legacy"');
  });

  it("renders linked reusable instances from their source while retaining the instance selection marker", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const rootId = document.pages[0].rootNodeIds[0];
    const source: EditorNode = {
      id: "shared_feature_source",
      type: "layout.section",
      kind: "section",
      props: {},
      visibility: { base: true },
      slots: { default: { name: "default", childIds: ["shared_feature_heading"] } },
    };
    const withSource = addNode(document, source, rootId);
    const withHeading = addNode(withSource, {
      id: "shared_feature_heading",
      type: "component.heading",
      kind: "component",
      props: { text: "Shared feature", level: 2 },
      visibility: { base: true },
      slots: {},
    }, source.id);
    const instance: EditorNode = {
      id: "shared_feature_instance",
      type: "layout.section",
      kind: "section",
      props: {},
      visibility: { base: true },
      slots: { default: { name: "default", childIds: [] } },
      symbolReference: { symbolId: "shared_feature" },
    };
    const complete = addNode(withHeading, instance, rootId);
    complete.globals.symbols.shared_feature = { id: "shared_feature", name: "Shared feature", rootNodeId: source.id };

    const html = render(complete);

    expect(html).toMatch(/data-editor-symbol-instance-id="shared_feature_instance"[^>]*>[\s\S]*Shared feature/);
    expect(html).toContain('data-editor-symbol-instance-id="shared_feature_instance"');
  });

  it("binds semantic palette, typography, header navigation, and interaction tokens to the live document canvas", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const headerId = document.globals.header!.nodeId;
    const headerMenu = document.navigation.menus.find((menu) => menu.location === "header")!;
    const headerItem = headerMenu.items[0]!;
    document.site.styles = {
      ...document.site.styles,
      themeMode: "dark",
      spacing: "spacious",
      radius: "lg",
      palette: {
        primary: "#2563eb",
        accent: "#0f766e",
        background: "#0f172a",
        surface: "#1e293b",
        elevatedSurface: "#334155",
        primaryText: "#f8fafc",
        secondaryText: "#cbd5e1",
        mutedText: "#94a3b8",
        border: "#475569",
        success: "#16a34a",
        warning: "#f59e0b",
        error: "#dc2626",
      },
      typography: { headingFontFamily: "serif", bodyFontFamily: "sans", scale: "generous" },
    };
    document.nodes[headerId] = {
      ...document.nodes[headerId],
      props: { ...document.nodes[headerId].props, navigationItemStyle: "buttons", navigationLinkColor: "#e2e8f0", navigationActiveColor: "#fef08a" },
      styles: { backgroundColor: "#111827", textColor: "#f8fafc", borderStyle: "dashed", borderWidth: 2, gap: "sm", hoverBackgroundColor: "#1f2937", focusColor: "#fef08a" },
    };
    headerMenu.items[0] = { ...headerItem, variant: "button" };

    const html = render(document);

    expect(html).toContain('data-theme-mode="dark"');
    expect(html).toContain('data-editor-has-global-radius="true"');
    expect(html).toContain('--gs-accent:#0f766e');
    expect(html).toContain('--gs-bg:#0f172a');
    expect(html).toContain('--gs-surface-strong:#334155');
    expect(html).toContain('--gs-editor-site-space-md:1.25rem');
    expect(html).toContain('--gs-editor-global-radius:var(--gs-editor-radius-lg)');
    expect(html).toContain('--font-heading:var(--gs-editor-font-serif)');
    expect(html).toContain('data-navigation-style="buttons"');
    expect(html).toContain('--gs-editor-nav-link-color:#e2e8f0');
    expect(html).toContain('--gs-editor-nav-gap:var(--gs-editor-local-space-sm)');
    expect(html).toContain('gs-site-nav-link is-active is-button');
    expect(html).toContain('--gs-editor-node-hover-background:#1f2937');
    expect(html).toContain('border-style:dashed');
  });

  it("keeps breakpoint-specific visibility renderable and applies the editable hero secondary CTA target", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const hero = Object.values(document.nodes).find((node) => node.type === "section.hero")!;
    const heroContent = hero.props.content as Record<string, string>;
    document.nodes[hero.id] = {
      ...hero,
      props: { ...hero.props, content: { ...heroContent, secondaryCtaHref: "https://example.test/learn-more" } },
      visibility: { base: false, desktop: true, mobile: false },
    };

    const html = render(document);

    expect(html).toContain('href="https://example.test/learn-more"');
    expect(html).toContain("gs-document-hidden-base");
    expect(html).toContain("gs-document-visible-desktop");
    expect(html).toContain("gs-document-hidden-mobile");
  });
});

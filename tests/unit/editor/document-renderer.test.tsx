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

    const html = render(complete);

    expect(html).toContain("Registry heading");
    expect(html).toContain("Unsafe URL");
    expect(html).not.toContain("javascript:alert");
    expect(html).toContain('src="https://cdn.example.test/generic-image.png"');
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
});

import { describe, expect, it } from "vitest";
import {
  adaptWebsiteStructureToEditorDocument,
  validateEditorDocument,
  type EditorDocument,
  type EditorNode,
} from "@/lib/editor/document";
import {
  editorComponentRegistry,
  getComponentDefaultProps,
  getComponentDefinition,
  validateEditorDocumentRegistry,
} from "@/lib/editor/registry";
import {
  createLegacyUnknownSectionFixture,
  createStandardMarketingSiteFixture,
} from "@/tests/fixtures/editor-document";

function createDocument(): EditorDocument {
  return adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
}

function addNode(document: EditorDocument, node: EditorNode): EditorDocument {
  return {
    ...document,
    nodes: {
      ...document.nodes,
      [node.id]: node,
    },
  };
}

describe("editor component registry", () => {
  it("looks up registered types and returns detached default props", () => {
    expect(getComponentDefinition("section.hero")).toMatchObject({
      label: "Hero",
      renderer: { key: "section-compat" },
    });
    expect(editorComponentRegistry.list()).toEqual(
      expect.arrayContaining([expect.objectContaining({ type: "layout.page-root" })]),
    );

    const first = getComponentDefaultProps("component.button")!;
    first.label = "Changed locally";
    expect(getComponentDefaultProps("component.button")).toEqual({ label: "Learn more", href: "#" });
  });

  it("accepts the existing WebsiteStructure compatibility output", () => {
    const document = adaptWebsiteStructureToEditorDocument(createLegacyUnknownSectionFixture());

    expect(validateEditorDocument(document)).toEqual([]);
    expect(validateEditorDocumentRegistry(document)).toEqual([]);
  });

  it("reports required and invalid prop values with node IDs", () => {
    const document = addNode(createDocument(), {
      id: "component_button_invalid",
      type: "component.button",
      kind: "component",
      props: { label: "", href: "javascript:alert(1)" },
      visibility: { base: true },
      slots: {},
    });

    const errors = validateEditorDocument(document);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          nodeId: "component_button_invalid",
          message: "Required property is missing.",
        }),
        expect.objectContaining({
          nodeId: "component_button_invalid",
          message: "Property must be a valid url.",
        }),
      ]),
    );
  });

  it("enforces slot relationships and style capabilities", () => {
    const document = createDocument();
    const rootId = document.pages[0].rootNodeIds[0];
    const invalid = structuredClone(document) as EditorDocument;
    invalid.nodes[rootId].slots.default.childIds = ["paragraph_not_allowed"];
    invalid.nodes.paragraph_not_allowed = {
      id: "paragraph_not_allowed",
      type: "component.paragraph",
      kind: "component",
      props: { text: "A paragraph" },
      styles: { container: "card" },
      visibility: { base: true },
      slots: {},
    };

    const messages = validateEditorDocument(invalid).map((error) => error.message);

    expect(messages).toEqual(
      expect.arrayContaining([
        "Child type is not allowed in this slot.",
        "Child type is not allowed under this parent.",
        "Style token is not supported by this component type.",
      ]),
    );
  });

  it("rejects unregistered current nodes but permits explicit legacy exception nodes", () => {
    const document = createDocument();
    const invalid = addNode(document, {
      id: "unknown_node",
      type: "component.unknown",
      kind: "component",
      props: {},
      visibility: { base: true },
      slots: {},
    });
    const legacy = addNode(document, {
      id: "legacy_node",
      type: "legacy.component.unknown",
      kind: "legacy",
      props: { content: { headline: "Still retained" } },
      visibility: { base: true },
      slots: {},
      legacy: {
        source: "website-structure",
        sourceId: "old-component",
        sourceType: "unknown",
        unsupported: true,
      },
    });

    expect(validateEditorDocument(invalid)).toEqual(
      expect.arrayContaining([expect.objectContaining({ message: "Node type is not registered." })]),
    );
    expect(validateEditorDocument(legacy)).toEqual([]);
  });

  it("reports missing asset and reusable-symbol references without mutating the document", () => {
    const document = createDocument();
    const invalid = addNode(document, {
      id: "image_missing_reference",
      type: "component.image",
      kind: "component",
      props: { src: "https://cdn.example.test/image.png", alt: "Missing reference" },
      assetIds: ["asset_missing"],
      symbolReference: { symbolId: "symbol_missing" },
      visibility: { base: true },
      slots: {},
    });

    expect(validateEditorDocument(invalid)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: "Node references a missing asset." }),
        expect.objectContaining({ message: "Node references a missing reusable symbol." }),
      ]),
    );
  });
});

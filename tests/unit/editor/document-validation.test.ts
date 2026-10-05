import { describe, expect, it } from "vitest";
import { adaptWebsiteStructureToEditorDocument, validateEditorDocument } from "@/lib/editor/document";
import type { EditorDocument } from "@/lib/editor/document";
import { createStandardMarketingSiteFixture } from "@/tests/fixtures/editor-document";

function createDocument(): EditorDocument {
  return adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
}

describe("EditorDocument structural validation", () => {
  it("accepts a document produced by the compatibility adapter", () => {
    expect(validateEditorDocument(createDocument())).toEqual([]);
  });

  it("rejects invalid schema versions, missing references, and invalid navigation targets", () => {
    const document = createDocument();
    const invalid = {
      ...document,
      schemaVersion: 999,
      pages: [{ ...document.pages[0], rootNodeIds: ["missing-root"] }],
      navigation: {
        ...document.navigation,
        menus: [
          {
            ...document.navigation.menus[0],
            items: [
              {
                ...document.navigation.menus[0].items[0],
                target: { kind: "page" as const, pageId: "missing-page" },
              },
            ],
          },
        ],
      },
    } as unknown as EditorDocument;

    const errors = validateEditorDocument(invalid);
    expect(errors.map((error) => error.message)).toEqual(
      expect.arrayContaining([
        "Expected schema version 1.",
        "Page root references a missing node.",
        "Navigation target page does not exist.",
      ]),
    );
  });

  it("rejects cycles, duplicate child references, unsafe prop values, and unsupported styles", () => {
    const document = createDocument();
    const rootId = document.pages[0].rootNodeIds[0];
    const invalid = structuredClone(document) as EditorDocument;
    invalid.nodes[rootId].slots.default.childIds = [rootId, rootId];
    (invalid.nodes[rootId].props as Record<string, unknown>).unsafe = () => "not serializable";
    (invalid.nodes[rootId].styles as Record<string, unknown> | undefined) ??= {};
    (invalid.nodes[rootId].styles as Record<string, unknown>).width = "raw-css-width";

    const errors = validateEditorDocument(invalid);
    expect(errors.map((error) => error.message)).toEqual(
      expect.arrayContaining([
        "A slot cannot reference a child more than once.",
        "Node tree contains a cycle.",
        "Document props must be JSON-compatible and cannot contain executable values.",
        "Unsupported width token.",
      ]),
    );
  });
});

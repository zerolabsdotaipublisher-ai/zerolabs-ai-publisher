import { describe, expect, it } from "vitest";
import {
  adaptWebsiteStructureToEditorDocument,
  getEditorDocumentProjectabilityIssues,
  trustedWebsiteStructureState,
  type EditorDocument,
  type EditorNode,
} from "@/lib/editor/document";
import {
  createVisualEditorState,
  findVisualEditorNodePageId,
  getVisualEditorGlobalLayers,
  getVisualEditorCompatibilityNotice,
  getVisualEditorNodeControls,
  getVisualEditorPageLayers,
  getVisualEditorSaveState,
  visualEditorReducer,
  VISUAL_EDITOR_PERSISTENCE_ENABLED,
} from "@/lib/editor/visual";
import {
  createLegacyUnknownSectionFixture,
  createMultiPageSiteFixture,
  createStandardMarketingSiteFixture,
} from "@/tests/fixtures/editor-document";

function documentWithButton(): EditorDocument {
  const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
  const hero = Object.values(document.nodes).find((node) => node.type === "section.hero")!;
  const button: EditorNode = {
    id: "visual_editor_button",
    type: "component.button",
    kind: "component",
    props: { label: "Start now", href: "/start" },
    visibility: { base: true },
    slots: {},
  };
  return {
    ...document,
    nodes: {
      ...document.nodes,
      [hero.id]: {
        ...hero,
        slots: {
          ...hero.slots,
          components: {
            name: "components",
            childIds: [...(hero.slots.components?.childIds ?? []), button.id],
          },
        },
      },
      [button.id]: button,
    },
  };
}

describe("visual editor draft state", () => {
  it("synchronizes stable canvas and layer selection IDs", () => {
    const document = documentWithButton();
    const pageId = document.pages[0].id;
    const layers = getVisualEditorPageLayers(document, pageId);
    const hero = Object.values(document.nodes).find((node) => node.type === "section.hero")!;
    const state = visualEditorReducer(createVisualEditorState(document), { type: "select-node", nodeId: hero.id, pageId });

    expect(layers[0].children.some((node) => node.id === hero.id)).toBe(true);
    expect(getVisualEditorGlobalLayers(document).map((node) => node.id)).toContain(document.globals.header!.nodeId);
    expect(state.selectedNodeId).toBe(hero.id);
    expect(findVisualEditorNodePageId(document, hero.id)).toBe(pageId);
  });

  it("derives generic registry property controls without section-specific panels", () => {
    const document = documentWithButton();
    const button = document.nodes.visual_editor_button;
    const controls = getVisualEditorNodeControls(button);

    expect(controls?.props.map((property) => property.path)).toContain("label");
    expect(controls?.props.map((property) => property.path)).toContain("target");
    expect(controls?.styles.map((property) => property.key)).toContain("backgroundColor");
    expect(controls?.styles.map((property) => property.key)).toContain("fontWeight");
  });

  it("updates text, button properties, colors, typography, and spacing in the local document", () => {
    const document = documentWithButton();
    const hero = Object.values(document.nodes).find((node) => node.type === "section.hero")!;
    let state = createVisualEditorState(document);
    state = visualEditorReducer(state, { type: "update-node-prop", nodeId: hero.id, path: "content.headline", value: "A local headline" });
    state = visualEditorReducer(state, { type: "update-node-prop", nodeId: "visual_editor_button", path: "label", value: "Book a demo" });
    state = visualEditorReducer(state, { type: "update-node-style", nodeId: "visual_editor_button", key: "backgroundColor", value: "#1255aa" });
    state = visualEditorReducer(state, { type: "update-node-style", nodeId: "visual_editor_button", key: "fontWeight", value: 700 });
    state = visualEditorReducer(state, { type: "update-node-style", nodeId: hero.id, key: "padding", value: "xl" });

    expect((state.document.nodes[hero.id].props.content as { headline: string }).headline).toBe("A local headline");
    expect(state.document.nodes.visual_editor_button.props.label).toBe("Book a demo");
    expect(state.document.nodes.visual_editor_button.styles).toMatchObject({ backgroundColor: "#1255aa", fontWeight: 700 });
    expect(state.document.nodes[hero.id].styles?.padding).toBe("xl");
    expect(state.dirty).toBe(true);
  });

  it("updates page, site, and responsive visibility settings in memory", () => {
    const document = adaptWebsiteStructureToEditorDocument(createMultiPageSiteFixture());
    const page = document.pages[1];
    const hero = Object.values(document.nodes).find((node) => node.type === "section.hero" && node.legacy?.sourceId === "sec_hero_about_001")!;
    let state = createVisualEditorState(document, page.id);
    state = visualEditorReducer(state, { type: "update-page", pageId: page.id, path: "seo.title", value: "About locally" });
    state = visualEditorReducer(state, { type: "update-page", pageId: page.id, path: "visibility.base", value: false });
    state = visualEditorReducer(state, { type: "update-site", path: "styles.palette.primary", value: "#1a73e8" });
    state = visualEditorReducer(state, { type: "update-site", path: "tagline", value: "A local tagline" });
    state = visualEditorReducer(state, { type: "update-node-visibility", nodeId: hero.id, breakpoint: "mobile", value: false });

    expect(state.document.pages[1].seo.title).toBe("About locally");
    expect(state.document.pages[1].visibility.base).toBe(false);
    expect(state.document.site.styles.palette?.primary).toBe("#1a73e8");
    expect(state.document.site.tagline).toBe("A local tagline");
    expect(state.document.nodes[state.document.globals.header!.nodeId].props.tagline).toBe("A local tagline");
    expect(state.document.nodes[hero.id].visibility.mobile).toBe(false);
  });

  it("switches viewports and provides document-only undo and redo", () => {
    const document = documentWithButton();
    let state = createVisualEditorState(document);
    state = visualEditorReducer(state, { type: "set-viewport", viewport: "mobile" });
    state = visualEditorReducer(state, { type: "update-node-prop", nodeId: "visual_editor_button", path: "label", value: "Changed" });
    const changed = state;
    state = visualEditorReducer(state, { type: "undo" });

    expect(state.activeViewport).toBe("mobile");
    expect(state.document.nodes.visual_editor_button.props.label).toBe("Start now");
    expect(state.dirty).toBe(false);

    state = visualEditorReducer(state, { type: "redo" });
    expect(state.document.nodes.visual_editor_button.props.label).toBe("Changed");
    expect(state.dirty).toBe(true);
    expect(changed.redoStack).toHaveLength(0);
  });

  it("keeps Save disabled and reports legacy projection risks without persistence", () => {
    const structure = createLegacyUnknownSectionFixture();
    const document = adaptWebsiteStructureToEditorDocument(structure);
    const saveState = getVisualEditorSaveState(createVisualEditorState(document));
    const issues = getEditorDocumentProjectabilityIssues(document, trustedWebsiteStructureState(structure));

    expect(VISUAL_EDITOR_PERSISTENCE_ENABLED).toBe(false);
    expect(saveState.disabled).toBe(true);
    expect(saveState.label).toBe("Save disabled");
    expect(getVisualEditorCompatibilityNotice(document, issues).message).toContain("unsupported legacy node");
    expect(Object.values(document.nodes).some((node) => node.legacy?.unsupported)).toBe(true);
  });
});

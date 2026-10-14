import { describe, expect, it } from "vitest";
import {
  adaptWebsiteStructureToEditorDocument,
  getEditorDocumentProjectabilityIssues,
  trustedWebsiteStructureState,
  validateEditorDocument,
  type EditorDocument,
  type EditorNode,
} from "@/lib/editor/document";
import {
  createVisualEditorState,
  executeVisualEditorStructuralCommand,
  findVisualEditorNodePageId,
  getVisualEditorGlobalLayers,
  getVisualEditorCompatibilityNotice,
  getVisualEditorNodeControls,
  getVisualEditorPageLayers,
  getVisualEditorSaveState,
  getVisualEditorInsertOptions,
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

function documentWithImage(): EditorDocument {
  const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
  const hero = Object.values(document.nodes).find((node) => node.type === "section.hero")!;
  const image: EditorNode = {
    id: "visual_editor_image",
    type: "component.image",
    kind: "component",
    props: { src: "draft_image_asset", alt: "Initial draft image", fit: "cover" },
    visibility: { base: true },
    slots: {},
  };
  return {
    ...document,
    assets: {
      ...document.assets,
      draft_image_asset: { id: "draft_image_asset", source: "external", url: "https://cdn.example.test/draft-image.png", alt: "Initial draft image" },
    },
    nodes: {
      ...document.nodes,
      [hero.id]: {
        ...hero,
        slots: {
          ...hero.slots,
          components: { name: "components", childIds: [...(hero.slots.components?.childIds ?? []), image.id] },
        },
      },
      [image.id]: image,
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

  it("keeps every registry-authorized layout, style, and typography token valid", () => {
    const document = documentWithButton();
    const hero = Object.values(document.nodes).find((node) => node.type === "section.hero")!;
    let state = createVisualEditorState(document);
    const styles = {
      alignment: "center",
      width: "wide",
      container: "card",
      spacing: "spacious",
      columns: 3,
      backgroundColor: "#123456",
      textColor: "#abcdef",
      accentColor: "#112233",
      borderColor: "#445566",
      borderWidth: 2,
      radius: "lg",
      shadow: "md",
      opacity: 0.8,
      padding: "xl",
      margin: "lg",
      gap: "md",
      height: "content",
      minHeight: "medium",
      fontFamily: "serif",
      fontSize: "2xl",
      fontWeight: 700,
      lineHeight: "relaxed",
      letterSpacing: "wide",
    } as const;

    Object.entries(styles).forEach(([key, value]) => {
      state = visualEditorReducer(state, { type: "update-node-style", nodeId: hero.id, key: key as keyof NonNullable<typeof hero.styles>, value });
    });

    expect(state.document.nodes[hero.id].styles).toMatchObject(styles);
    expect(validateEditorDocument(state.document)).toEqual([]);
  });

  it("edits image URL or asset references with live fit, layout, style, and visibility tokens", () => {
    const document = documentWithImage();
    let state = createVisualEditorState(document);

    state = visualEditorReducer(state, { type: "update-node-prop", nodeId: "visual_editor_image", path: "src", value: "https://cdn.example.test/replacement.png" });
    state = visualEditorReducer(state, { type: "update-node-prop", nodeId: "visual_editor_image", path: "alt", value: "Replacement draft image" });
    state = visualEditorReducer(state, { type: "update-node-prop", nodeId: "visual_editor_image", path: "fit", value: "contain" });
    state = visualEditorReducer(state, { type: "update-node-style", nodeId: "visual_editor_image", key: "width", value: "wide" });
    state = visualEditorReducer(state, { type: "update-node-style", nodeId: "visual_editor_image", key: "size", value: "lg" });
    state = visualEditorReducer(state, { type: "update-node-style", nodeId: "visual_editor_image", key: "alignment", value: "center" });
    state = visualEditorReducer(state, { type: "update-node-style", nodeId: "visual_editor_image", key: "radius", value: "pill" });
    state = visualEditorReducer(state, { type: "update-node-visibility", nodeId: "visual_editor_image", breakpoint: "mobile", value: false });

    expect(state.document.nodes.visual_editor_image).toMatchObject({
      props: { src: "https://cdn.example.test/replacement.png", alt: "Replacement draft image", fit: "contain" },
      styles: { width: "wide", size: "lg", alignment: "center", radius: "pill" },
      visibility: { base: true, mobile: false },
    });
    expect(validateEditorDocument(state.document)).toEqual([]);
  });

  it("updates page, site, and responsive visibility settings in memory", () => {
    const document = adaptWebsiteStructureToEditorDocument(createMultiPageSiteFixture());
    const page = document.pages[1];
    const hero = Object.values(document.nodes).find((node) => node.type === "section.hero" && node.legacy?.sourceId === "sec_hero_about_001")!;
    let state = createVisualEditorState(document, page.id);
    state = visualEditorReducer(state, { type: "update-page", pageId: page.id, path: "seo.title", value: "About locally" });
    state = visualEditorReducer(state, { type: "update-page", pageId: page.id, path: "seo.openGraph.title", value: "About locally on social" });
    state = visualEditorReducer(state, { type: "update-page", pageId: page.id, path: "seo.openGraph.description", value: "A clear description" });
    state = visualEditorReducer(state, { type: "update-page", pageId: page.id, path: "seo.openGraph.type", value: "article" });
    state = visualEditorReducer(state, { type: "update-page", pageId: page.id, path: "seo.openGraph.image", value: "https://cdn.example.test/about-og.png" });
    state = visualEditorReducer(state, { type: "update-page", pageId: page.id, path: "visibility.base", value: false });
    state = visualEditorReducer(state, { type: "update-site", path: "styles.palette.primary", value: "#1a73e8" });
    state = visualEditorReducer(state, { type: "update-site", path: "tagline", value: "A local tagline" });
    state = visualEditorReducer(state, { type: "update-node-visibility", nodeId: hero.id, breakpoint: "mobile", value: false });

    expect(state.document.pages[1].seo.title).toBe("About locally");
    expect(state.document.pages[1].seo.openGraph).toMatchObject({
      title: "About locally on social",
      description: "A clear description",
      type: "article",
      image: "https://cdn.example.test/about-og.png",
    });
    expect(state.document.pages[1].visibility.base).toBe(false);
    expect(state.document.site.styles.palette?.primary).toBe("#1a73e8");
    expect(state.document.site.tagline).toBe("A local tagline");
    expect(state.document.nodes[state.document.globals.header!.nodeId].props.tagline).toBe("A local tagline");
    expect(state.document.nodes[hero.id].visibility.mobile).toBe(false);
    expect(validateEditorDocument(state.document)).toEqual([]);
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

  it("adds, duplicates, reorders, and removes registry-valid local elements", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const pageId = document.pages[0].id;
    const pageRootId = document.pages[0].rootNodeIds[0];
    let state = createVisualEditorState(document);

    const pageRootOptions = getVisualEditorInsertOptions(document, { parentId: pageRootId, slotName: "default", label: "Page root" }).map((option) => option.type);
    expect(pageRootOptions).toEqual(expect.arrayContaining(["layout.section", "layout.container", "section.hero"]));
    expect(pageRootOptions).not.toContain("component.image");

    state = visualEditorReducer(state, {
      type: "insert-node",
      target: { parentId: pageRootId, slotName: "default", label: "Page root" },
      nodeType: "layout.section",
    });
    const sectionId = state.selectedNodeId!;
    expect(getVisualEditorInsertOptions(state.document, { parentId: sectionId, slotName: "default", label: "Selected section" }).map((option) => option.type))
      .toEqual(expect.arrayContaining(["layout.container", "component.heading", "component.paragraph"]));
    state = visualEditorReducer(state, {
      type: "insert-node",
      target: { parentId: sectionId, slotName: "default", label: "Selected section" },
      nodeType: "layout.columns",
    });
    const columnsId = state.selectedNodeId!;

    expect(state.document.nodes[columnsId].slots.default.childIds).toHaveLength(1);
    expect(validateEditorDocument(state.document)).toEqual([]);

    const onlyColumnId = state.document.nodes[columnsId].slots.default.childIds[0];
    expect(visualEditorReducer(state, { type: "remove-node", nodeId: onlyColumnId })).toBe(state);
    state = visualEditorReducer(state, { type: "duplicate-node", nodeId: onlyColumnId });
    state = visualEditorReducer(state, { type: "duplicate-node", nodeId: state.selectedNodeId! });
    const fullColumns = state;
    expect(visualEditorReducer(state, { type: "duplicate-node", nodeId: state.selectedNodeId! })).toBe(fullColumns);
    expect(visualEditorReducer(state, {
      type: "insert-node",
      target: { parentId: columnsId, slotName: "default", label: "Columns" },
      nodeType: "layout.column",
    })).toBe(fullColumns);
    expect(validateEditorDocument(state.document)).toEqual([]);

    state = visualEditorReducer(state, { type: "duplicate-node", nodeId: columnsId });
    const duplicateId = state.selectedNodeId!;
    expect(duplicateId).not.toBe(columnsId);
    expect(validateEditorDocument(state.document)).toEqual([]);

    state = visualEditorReducer(state, { type: "move-node", nodeId: duplicateId, direction: "up" });
    expect(state.document.nodes[sectionId].slots.default.childIds[0]).toBe(duplicateId);

    state = visualEditorReducer(state, { type: "remove-node", nodeId: duplicateId });
    expect(state.document.nodes[duplicateId]).toBeUndefined();
    expect(state.selectedPageId).toBe(pageId);
    expect(state.selectedNodeId).toBe(sectionId);
    expect(validateEditorDocument(state.document)).toEqual([]);
  });

  it("keeps structural selection valid after add, duplicate, move, delete, undo, and redo", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const pageId = document.pages[0].id;
    const pageRootId = document.pages[0].rootNodeIds[0];
    let state = createVisualEditorState(document);

    state = visualEditorReducer(state, {
      type: "insert-node",
      target: { parentId: pageRootId, slotName: "default", label: "Page root" },
      nodeType: "layout.section",
    });
    const sectionId = state.selectedNodeId!;
    expect(state.selectedNodeId).toBe(sectionId);

    state = visualEditorReducer(state, {
      type: "insert-node",
      target: { parentId: sectionId, slotName: "default", label: "Section" },
      nodeType: "component.heading",
    });
    const headingId = state.selectedNodeId!;
    state = visualEditorReducer(state, { type: "duplicate-node", nodeId: headingId });
    const duplicateId = state.selectedNodeId!;
    expect(duplicateId).not.toBe(headingId);

    state = visualEditorReducer(state, { type: "move-node", nodeId: duplicateId, direction: "up" });
    expect(state.selectedNodeId).toBe(duplicateId);

    state = visualEditorReducer(state, { type: "remove-node", nodeId: duplicateId });
    expect(state.selectedNodeId).toBe(sectionId);
    expect(state.selectedScope).toBe("node");

    let transientState = createVisualEditorState(document);
    transientState = visualEditorReducer(transientState, {
      type: "insert-node",
      target: { parentId: pageRootId, slotName: "default", label: "Page root" },
      nodeType: "layout.section",
    });
    const transientId = transientState.selectedNodeId!;
    transientState = visualEditorReducer(transientState, { type: "undo" });
    expect(transientState.document.nodes[transientId]).toBeUndefined();
    expect(transientState.selectedNodeId).toBeUndefined();
    expect(transientState.selectedScope).toBe("page");
    expect(transientState.selectedPageId).toBe(pageId);

    transientState = visualEditorReducer(transientState, { type: "redo" });
    expect(transientState.selectedNodeId).toBeUndefined();
    expect(transientState.document.nodes[transientState.selectedNodeId ?? ""]).toBeUndefined();
  });

  it("uses the central structural command gate without mutating or accepting an invalid document", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const pageRootId = document.pages[0].rootNodeIds[0];
    const original = structuredClone(document);

    const result = executeVisualEditorStructuralCommand(document, {
      type: "insert-node",
      target: { parentId: pageRootId, slotName: "default", label: "Page root" },
      nodeType: "layout.section",
    });

    expect(result?.insertedNodeId).toBeDefined();
    expect(validateEditorDocument(result!.document)).toEqual([]);
    expect(document).toEqual(original);

    const invalidDocument = structuredClone(document);
    invalidDocument.nodes[pageRootId].slots.default.childIds.push("missing_node");
    expect(executeVisualEditorStructuralCommand(invalidDocument, {
      type: "insert-node",
      target: { parentId: pageRootId, slotName: "default", label: "Page root" },
      nodeType: "layout.section",
    })).toBeUndefined();

    const leafDocument = documentWithButton();
    expect(executeVisualEditorStructuralCommand(leafDocument, {
      type: "insert-node",
      target: { parentId: "visual_editor_button", slotName: "default", label: "Button" },
      nodeType: "component.heading",
    })).toBeUndefined();

    const cyclicDocument = structuredClone(document);
    cyclicDocument.nodes[pageRootId].slots.default.childIds.push(pageRootId);
    expect(validateEditorDocument(cyclicDocument).some((error) => error.message.includes("cycle"))).toBe(true);
    expect(executeVisualEditorStructuralCommand(cyclicDocument, {
      type: "move-node",
      nodeId: pageRootId,
      direction: "up",
    })).toBeUndefined();
  });

  it("remaps links inside a duplicated subtree to the fresh node identities", () => {
    const document = documentWithButton();
    const hero = Object.values(document.nodes).find((node) => node.type === "section.hero")!;
    const linkedDocument: EditorDocument = {
      ...document,
      nodes: {
        ...document.nodes,
        visual_editor_button: {
          ...document.nodes.visual_editor_button,
          props: { ...document.nodes.visual_editor_button.props, target: { kind: "node", nodeId: hero.id } },
        },
      },
    };

    const result = executeVisualEditorStructuralCommand(linkedDocument, { type: "duplicate-node", nodeId: hero.id });
    const duplicateId = result?.insertedNodeId;
    const duplicateButtonId = duplicateId ? result.document.nodes[duplicateId].slots.components.childIds.find((nodeId) => result.document.nodes[nodeId].type === "component.button") : undefined;

    expect(duplicateId).toBeDefined();
    expect(result?.document.nodes[duplicateButtonId!].props.target).toEqual({ kind: "node", nodeId: duplicateId });
    expect(validateEditorDocument(result!.document)).toEqual([]);
  });

  it("reorders navigation locally and refuses to remove a navigation target", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const pageRootId = document.pages[0].rootNodeIds[0];
    const headerMenu = document.navigation.menus.find((menu) => menu.location === "header")!;
    let state = createVisualEditorState(document);

    state = visualEditorReducer(state, { type: "move-navigation-item", menuId: headerMenu.id, itemId: headerMenu.items[0].id, direction: "down" });
    expect(state.document.navigation.menus.find((menu) => menu.id === headerMenu.id)?.items[1].id).toBe(headerMenu.items[0].id);

    state = visualEditorReducer(state, {
      type: "insert-node",
      target: { parentId: pageRootId, slotName: "default", label: "Page root" },
      nodeType: "section.cta",
    });
    const ctaId = state.selectedNodeId!;
    state = visualEditorReducer(state, {
      type: "update-navigation-item",
      menuId: headerMenu.id,
      itemId: headerMenu.items[0].id,
      patch: { target: { kind: "node", nodeId: ctaId } },
    });
    const unchanged = visualEditorReducer(state, { type: "remove-node", nodeId: ctaId });

    expect(unchanged).toBe(state);
    expect(state.document.nodes[ctaId]).toBeDefined();
    expect(validateEditorDocument(state.document)).toEqual([]);
  });

  it("adds, nests, edits, and removes local navigation items", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const headerMenu = document.navigation.menus.find((menu) => menu.location === "header")!;
    const pageId = document.pages[0].id;
    let state = createVisualEditorState(document);

    state = visualEditorReducer(state, { type: "add-navigation-item", menuId: headerMenu.id });
    const added = state.document.navigation.menus.find((menu) => menu.id === headerMenu.id)!.items.at(-1)!;
    expect(added).toMatchObject({ label: "New navigation item", target: { kind: "page", pageId }, visible: true });

    state = visualEditorReducer(state, { type: "add-navigation-item", menuId: headerMenu.id, parentItemId: added.id });
    const parent = state.document.navigation.menus.find((menu) => menu.id === headerMenu.id)!.items.find((item) => item.id === added.id)!;
    const child = parent.children[0];
    expect(child.id).not.toBe(added.id);

    state = visualEditorReducer(state, {
      type: "update-navigation-item",
      menuId: headerMenu.id,
      itemId: child.id,
      patch: { label: "Support", visible: false, target: { kind: "external", url: "https://example.test/support" } },
    });
    const updatedChild = state.document.navigation.menus.find((menu) => menu.id === headerMenu.id)!.items.find((item) => item.id === added.id)!.children[0];
    expect(updatedChild).toMatchObject({ label: "Support", visible: false, target: { kind: "external", url: "https://example.test/support" } });

    expect(visualEditorReducer(state, {
      type: "update-navigation-item",
      menuId: headerMenu.id,
      itemId: child.id,
      patch: { target: { kind: "page", pageId: "missing-page" } },
    })).toBe(state);

    state = visualEditorReducer(state, { type: "remove-navigation-item", menuId: headerMenu.id, itemId: added.id });
    expect(state.document.navigation.menus.find((menu) => menu.id === headerMenu.id)?.items.some((item) => item.id === added.id)).toBe(false);
    expect(validateEditorDocument(state.document)).toEqual([]);
  });

  it("edits global header and footer content, styles, and visibility in the local draft", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const headerId = document.globals.header!.nodeId;
    const footerId = document.globals.footer!.nodeId;
    let state = createVisualEditorState(document);

    state = visualEditorReducer(state, { type: "update-node-prop", nodeId: headerId, path: "siteName", value: "Draft brand" });
    state = visualEditorReducer(state, { type: "update-node-style", nodeId: headerId, key: "backgroundColor", value: "#0f172a" });
    state = visualEditorReducer(state, { type: "update-node-prop", nodeId: footerId, path: "label", value: "Resources" });
    state = visualEditorReducer(state, { type: "update-node-prop", nodeId: footerId, path: "legalText", value: "© Draft site" });
    state = visualEditorReducer(state, { type: "update-node-style", nodeId: footerId, key: "textColor", value: "#f8fafc" });
    state = visualEditorReducer(state, { type: "update-node-visibility", nodeId: footerId, breakpoint: "mobile", value: false });

    expect(state.document.nodes[headerId].props.siteName).toBe("Draft brand");
    expect(state.document.nodes[headerId].styles?.backgroundColor).toBe("#0f172a");
    expect(state.document.nodes[footerId].props).toMatchObject({ label: "Resources", legalText: "© Draft site" });
    expect(state.document.nodes[footerId].styles?.textColor).toBe("#f8fafc");
    expect(state.document.nodes[footerId].visibility.mobile).toBe(false);
    expect(validateEditorDocument(state.document)).toEqual([]);
  });

  it("manages pages with unique identities and blocks deletion when navigation would break", () => {
    const document = adaptWebsiteStructureToEditorDocument(createMultiPageSiteFixture());
    const home = document.pages[0];
    let state = createVisualEditorState(document);

    state = visualEditorReducer(state, { type: "add-page" });
    const addedPageId = state.selectedPageId;
    const addedPage = state.document.pages.find((page) => page.id === addedPageId)!;
    expect(state.selectedNodeId).toBeUndefined();
    expect(addedPage.rootNodeIds).toHaveLength(1);
    expect(state.document.nodes[addedPage.rootNodeIds[0]].type).toBe("layout.page-root");

    state = visualEditorReducer(state, { type: "duplicate-page", pageId: home.id });
    const duplicatePageId = state.selectedPageId;
    const duplicatePage = state.document.pages.find((page) => page.id === duplicatePageId)!;
    expect(duplicatePage.id).not.toBe(home.id);
    expect(duplicatePage.path).not.toBe(home.path);
    expect(duplicatePage.rootNodeIds[0]).not.toBe(home.rootNodeIds[0]);

    state = visualEditorReducer(state, { type: "move-page", pageId: duplicatePageId, direction: "up" });
    expect(state.document.pages.findIndex((page) => page.id === duplicatePageId)).toBe(0);
    expect(state.document.pages.map((page) => page.order)).toEqual(state.document.pages.map((_, index) => index));

    const unchangedForPath = visualEditorReducer(state, { type: "update-page", pageId: duplicatePageId, path: "path", value: home.path });
    expect(unchangedForPath).toBe(state);

    const blocked = visualEditorReducer(state, { type: "remove-page", pageId: home.id });
    expect(blocked).toBe(state);

    state = visualEditorReducer(state, { type: "remove-page", pageId: addedPageId });
    expect(state.document.pages.some((page) => page.id === addedPageId)).toBe(false);
    expect(state.selectedPageId).toBeDefined();
    expect(validateEditorDocument(state.document)).toEqual([]);
  });

  it("nests a node beneath a compatible preceding sibling and moves it back out", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const pageRootId = document.pages[0].rootNodeIds[0];
    let state = createVisualEditorState(document);

    state = visualEditorReducer(state, {
      type: "insert-node",
      target: { parentId: pageRootId, slotName: "default", label: "Page root" },
      nodeType: "layout.container",
    });
    const firstContainerId = state.selectedNodeId!;
    state = visualEditorReducer(state, {
      type: "insert-node",
      target: { parentId: pageRootId, slotName: "default", label: "Page root" },
      nodeType: "layout.container",
    });
    const secondContainerId = state.selectedNodeId!;

    state = visualEditorReducer(state, { type: "nest-node", nodeId: secondContainerId });
    expect(state.document.nodes[firstContainerId].slots.default.childIds).toContain(secondContainerId);
    expect(validateEditorDocument(state.document)).toEqual([]);

    state = visualEditorReducer(state, { type: "unnest-node", nodeId: secondContainerId });
    const rootChildren = state.document.nodes[pageRootId].slots.default.childIds;
    expect(rootChildren.indexOf(secondContainerId)).toBe(rootChildren.indexOf(firstContainerId) + 1);
    expect(validateEditorDocument(state.document)).toEqual([]);
  });

  it("creates, inserts, detaches, and removes draft-only reusable components", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const pageRootId = document.pages[0].rootNodeIds[0];
    let state = createVisualEditorState(document);

    state = visualEditorReducer(state, {
      type: "insert-node",
      target: { parentId: pageRootId, slotName: "default", label: "Page root" },
      nodeType: "layout.section",
    });
    const sourceId = state.selectedNodeId!;
    state = visualEditorReducer(state, { type: "create-symbol", nodeId: sourceId, name: "Feature block" });
    const symbolId = Object.keys(state.document.globals.symbols)[0];

    expect(state.document.globals.symbols[symbolId]).toMatchObject({ name: "Feature block", rootNodeId: sourceId });
    expect(validateEditorDocument(state.document)).toEqual([]);

    state = visualEditorReducer(state, {
      type: "insert-symbol",
      target: { parentId: pageRootId, slotName: "default", label: "Page root" },
      symbolId,
    });
    const instanceId = state.selectedNodeId!;
    expect(state.document.nodes[instanceId].symbolReference).toEqual({ symbolId });
    expect(validateEditorDocument(state.document)).toEqual([]);

    expect(visualEditorReducer(state, { type: "remove-symbol", symbolId })).toBe(state);
    state = visualEditorReducer(state, { type: "unlink-symbol-instance", nodeId: instanceId });
    expect(state.document.nodes[instanceId].symbolReference).toBeUndefined();
    state = visualEditorReducer(state, { type: "rename-symbol", symbolId, name: "Renamed feature block" });
    expect(state.document.globals.symbols[symbolId].name).toBe("Renamed feature block");
    state = visualEditorReducer(state, { type: "remove-symbol", symbolId });

    expect(state.document.globals.symbols[symbolId]).toBeUndefined();
    expect(validateEditorDocument(state.document)).toEqual([]);
  });
});

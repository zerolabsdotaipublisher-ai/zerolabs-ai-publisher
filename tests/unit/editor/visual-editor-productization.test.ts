import { describe, expect, it } from "vitest";
import { routes } from "@/config/routes";
import {
  executeVisualEditorStructuralCommand,
  getVisualEditorGlobalLayers,
  getVisualEditorNodeControls,
  getVisualEditorSaveState,
  VISUAL_EDITOR_DESIGN_SECTIONS,
  VISUAL_EDITOR_DRAFT_ONLY_MESSAGE,
  VISUAL_EDITOR_LEGACY_HANDOFF,
  VISUAL_EDITOR_PERSISTENCE_ENABLED,
  VISUAL_EDITOR_PRIMARY_AREAS,
  VISUAL_EDITOR_PROPERTY_GROUPS,
} from "@/lib/editor/visual";
import { adaptWebsiteStructureToEditorDocument, validateEditorDocument } from "@/lib/editor/document";
import { createStandardMarketingSiteFixture } from "@/tests/fixtures/editor-document";

describe("visual editor productization", () => {
  it("routes the primary edit entry to the visual editor while preserving the legacy route", () => {
    expect(routes.editorPrimary("website id")).toBe("/editor/website%20id/visual");
    expect(routes.editorSite("website id")).toBe("/editor/website id");
    expect(VISUAL_EDITOR_LEGACY_HANDOFF).toMatchObject({
      actionLabel: "Open Visual Editor",
      notice: expect.stringContaining("recommended"),
    });
  });

  it("keeps all site-design controls grouped and discoverable", () => {
    expect(VISUAL_EDITOR_PRIMARY_AREAS.map((area) => area.label)).toEqual(["Pages", "Design", "Globals", "Navigation"]);
    expect(VISUAL_EDITOR_DESIGN_SECTIONS.colors.controls).toEqual(expect.arrayContaining([
      "Primary", "Secondary", "Accent", "Page Background", "Surface", "Elevated Surface", "Primary Text", "Secondary Text", "Muted Text", "Border", "Success", "Warning", "Error",
    ]));
    expect(VISUAL_EDITOR_DESIGN_SECTIONS.typography.controls).toEqual(["Heading Font", "Body Font", "Typography Scale"]);
    expect(VISUAL_EDITOR_DESIGN_SECTIONS.shape.controls).toEqual(["Global Corner Shape"]);
    expect(VISUAL_EDITOR_DESIGN_SECTIONS.spacing.controls).toEqual(["Global Spacing Scale"]);
    expect(VISUAL_EDITOR_DESIGN_SECTIONS.theme.controls).toEqual(["Light", "Dark", "Automatic"]);
  });

  it("keeps the header, header navigation, and registry property groups available", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const headerId = document.globals.header!.nodeId;
    const header = document.nodes[headerId]!;
    const headerControls = getVisualEditorNodeControls(header)!;

    expect(getVisualEditorGlobalLayers(document).map((layer) => layer.id)).toContain(headerId);
    expect(document.navigation.menus.some((menu) => menu.location === "header")).toBe(true);
    expect(headerControls.props.map((property) => property.path)).toEqual(expect.arrayContaining([
      "navigationAlignment", "navigationItemStyle", "navigationLinkColor", "navigationActiveColor",
    ]));
    expect(Object.values(VISUAL_EDITOR_PROPERTY_GROUPS).map((group) => group.label)).toEqual([
      "Content", "Layout", "Style", "Typography", "Effects", "Visibility", "Link / Action",
    ]);
  });

  it("retains draft-only save behavior and structural editing", () => {
    const document = adaptWebsiteStructureToEditorDocument(createStandardMarketingSiteFixture());
    const saveState = getVisualEditorSaveState();
    const rootNodeId = document.pages[0]!.rootNodeIds[0]!;
    const inserted = executeVisualEditorStructuralCommand(document, {
      type: "insert-node",
      target: { parentId: rootNodeId, slotName: "default", label: "Page root" },
      nodeType: "layout.section",
    });

    expect(VISUAL_EDITOR_PERSISTENCE_ENABLED).toBe(false);
    expect(saveState).toEqual({ disabled: true, label: "Save disabled", message: VISUAL_EDITOR_DRAFT_ONLY_MESSAGE });
    expect(inserted?.insertedNodeId).toBeTruthy();
    expect(validateEditorDocument(inserted!.document)).toEqual([]);
  });
});

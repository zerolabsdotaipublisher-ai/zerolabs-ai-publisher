import {
  EDITOR_DOCUMENT_SCHEMA_VERSION,
  type EditorDocument,
  type EditorDocumentValidationError,
  type EditorNavigationItem,
  type EditorNodeId,
  type EditorValue,
  type NodeStyleTokens,
  type PageStyleTokens,
  type ResponsiveVisibility,
  type SiteStyleTokens,
} from "./types";
import {
  editorComponentRegistry,
  validateEditorDocumentRegistry,
  type ComponentRegistry,
} from "@/lib/editor/registry";

const TONES = new Set(["professional", "casual", "premium", "friendly", "bold", "custom"]);
const VISUAL_STYLES = new Set(["minimalist", "modern", "corporate", "editorial", "playful", "custom"]);
const THEME_MODES = new Set(["light", "dark", "auto"]);
const SPACING = new Set(["compact", "comfortable", "spacious"]);
const ALIGNMENT = new Set(["left", "center", "balanced"]);
const WIDTHS = new Set(["narrow", "content", "wide", "full"]);
const CONTAINERS = new Set(["default", "card", "plain", "emphasis"]);
const SPACE_TOKENS = new Set(["none", "xs", "sm", "md", "lg", "xl", "2xl"]);
const RADIUS_TOKENS = new Set(["none", "sm", "md", "lg", "pill"]);
const SHADOW_TOKENS = new Set(["none", "sm", "md", "lg"]);
const FONT_FAMILIES = new Set(["inherit", "sans", "serif", "mono"]);
const FONT_SIZES = new Set(["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"]);
const FONT_WEIGHTS = new Set([400, 500, 600, 700, 800]);
const LINE_HEIGHTS = new Set(["tight", "normal", "relaxed"]);
const LETTER_SPACINGS = new Set(["tight", "normal", "wide"]);
const COMPONENT_SIZES = new Set(["sm", "md", "lg"]);
const HEIGHTS = new Set(["auto", "content", "screen"]);
const MIN_HEIGHTS = new Set(["none", "short", "medium", "tall", "screen"]);
const PAGE_TEMPLATES = new Set([
  "hero-first",
  "content-heavy",
  "minimal",
  "grid-based",
  "services-first",
  "contact-focused",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function push(
  errors: EditorDocumentValidationError[],
  path: string,
  message: string,
  nodeId?: EditorNodeId,
): void {
  errors.push({ path, message, ...(nodeId ? { nodeId } : {}) });
}

function validateEditorValue(value: unknown, path: string, errors: EditorDocumentValidationError[]): value is EditorValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return true;
  }

  if (typeof value === "number") {
    if (!Number.isFinite(value)) {
      push(errors, path, "Numbers in document props must be finite.");
      return false;
    }
    return true;
  }

  if (Array.isArray(value)) {
    return value.every((entry, index) => validateEditorValue(entry, `${path}.${index}`, errors));
  }

  if (isRecord(value)) {
    return Object.entries(value).every(([key, entry]) => validateEditorValue(entry, `${path}.${key}`, errors));
  }

  push(errors, path, "Document props must be JSON-compatible and cannot contain executable values.");
  return false;
}

function validateVisibility(
  visibility: ResponsiveVisibility | undefined,
  path: string,
  errors: EditorDocumentValidationError[],
): void {
  if (!visibility || typeof visibility.base !== "boolean") {
    push(errors, path, "Visibility must include a boolean base value.");
    return;
  }

  (["desktop", "tablet", "mobile"] as const).forEach((breakpoint) => {
    if (visibility[breakpoint] !== undefined && typeof visibility[breakpoint] !== "boolean") {
      push(errors, `${path}.${breakpoint}`, "Breakpoint visibility must be a boolean.");
    }
  });
}

function validateSiteStyles(
  styles: SiteStyleTokens | undefined,
  path: string,
  errors: EditorDocumentValidationError[],
): void {
  if (!styles) {
    push(errors, path, "Site styles are required.");
    return;
  }

  if (!TONES.has(styles.tone)) push(errors, `${path}.tone`, "Unsupported tone token.");
  if (!VISUAL_STYLES.has(styles.visualStyle)) push(errors, `${path}.visualStyle`, "Unsupported visual style token.");
  if (!THEME_MODES.has(styles.themeMode)) push(errors, `${path}.themeMode`, "Unsupported theme mode token.");
  if (!SPACING.has(styles.spacing)) push(errors, `${path}.spacing`, "Unsupported spacing token.");
  if (styles.palette) {
    Object.entries(styles.palette).forEach(([key, value]) => {
      if (value !== undefined && !isHexColor(value)) push(errors, `${path}.palette.${key}`, "Colors must be hexadecimal values.");
    });
  }
  if (styles.typography?.fontFamily && !FONT_FAMILIES.has(styles.typography.fontFamily)) {
    push(errors, `${path}.typography.fontFamily`, "Unsupported font family token.");
  }
  if (styles.typography?.scale && !["compact", "default", "generous"].includes(styles.typography.scale)) {
    push(errors, `${path}.typography.scale`, "Unsupported typography scale token.");
  }
}

function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{3,8}$/.test(value);
}

function validateNodeStyles(
  styles: NodeStyleTokens | undefined,
  path: string,
  errors: EditorDocumentValidationError[],
): void {
  if (!styles) return;

  if (styles.alignment !== undefined && !ALIGNMENT.has(styles.alignment)) push(errors, `${path}.alignment`, "Unsupported alignment token.");
  if (styles.width !== undefined && !WIDTHS.has(styles.width)) push(errors, `${path}.width`, "Unsupported width token.");
  if (styles.container !== undefined && !CONTAINERS.has(styles.container)) push(errors, `${path}.container`, "Unsupported container token.");
  if (styles.spacing !== undefined && !SPACING.has(styles.spacing)) push(errors, `${path}.spacing`, "Unsupported spacing token.");
  if (styles.columns !== undefined && ![1, 2, 3].includes(styles.columns)) push(errors, `${path}.columns`, "Unsupported column token.");
  if (styles.themeMode !== undefined && !THEME_MODES.has(styles.themeMode)) push(errors, `${path}.themeMode`, "Unsupported theme mode token.");
  (["backgroundColor", "textColor", "accentColor", "borderColor"] as const).forEach((key) => {
    if (styles[key] !== undefined && !isHexColor(styles[key])) push(errors, `${path}.${key}`, "Colors must be hexadecimal values.");
  });
  if (styles.borderWidth !== undefined && (!Number.isInteger(styles.borderWidth) || styles.borderWidth < 0 || styles.borderWidth > 24)) {
    push(errors, `${path}.borderWidth`, "Border width must be an integer between 0 and 24.");
  }
  if (styles.radius !== undefined && !RADIUS_TOKENS.has(styles.radius)) push(errors, `${path}.radius`, "Unsupported radius token.");
  if (styles.shadow !== undefined && !SHADOW_TOKENS.has(styles.shadow)) push(errors, `${path}.shadow`, "Unsupported shadow token.");
  if (styles.opacity !== undefined && (styles.opacity < 0 || styles.opacity > 1 || !Number.isFinite(styles.opacity))) {
    push(errors, `${path}.opacity`, "Opacity must be between 0 and 1.");
  }
  (["padding", "margin", "gap"] as const).forEach((key) => {
    if (styles[key] !== undefined && !SPACE_TOKENS.has(styles[key])) push(errors, `${path}.${key}`, "Unsupported spacing token.");
  });
  if (styles.height !== undefined && !HEIGHTS.has(styles.height)) push(errors, `${path}.height`, "Unsupported height token.");
  if (styles.minHeight !== undefined && !MIN_HEIGHTS.has(styles.minHeight)) push(errors, `${path}.minHeight`, "Unsupported minimum height token.");
  if (styles.fontFamily !== undefined && !FONT_FAMILIES.has(styles.fontFamily)) push(errors, `${path}.fontFamily`, "Unsupported font family token.");
  if (styles.fontSize !== undefined && !FONT_SIZES.has(styles.fontSize)) push(errors, `${path}.fontSize`, "Unsupported font size token.");
  if (styles.fontWeight !== undefined && !FONT_WEIGHTS.has(styles.fontWeight)) push(errors, `${path}.fontWeight`, "Unsupported font weight token.");
  if (styles.lineHeight !== undefined && !LINE_HEIGHTS.has(styles.lineHeight)) push(errors, `${path}.lineHeight`, "Unsupported line-height token.");
  if (styles.letterSpacing !== undefined && !LETTER_SPACINGS.has(styles.letterSpacing)) push(errors, `${path}.letterSpacing`, "Unsupported letter-spacing token.");
  if (styles.size !== undefined && !COMPONENT_SIZES.has(styles.size)) push(errors, `${path}.size`, "Unsupported component size token.");
}

function validatePageStyles(
  styles: PageStyleTokens | undefined,
  path: string,
  errors: EditorDocumentValidationError[],
): void {
  if (!styles) return;

  if (styles.template !== undefined && !PAGE_TEMPLATES.has(styles.template)) push(errors, `${path}.template`, "Unsupported page template token.");
  if (styles.themeMode !== undefined && !THEME_MODES.has(styles.themeMode)) push(errors, `${path}.themeMode`, "Unsupported theme mode token.");
  if (styles.spacing !== undefined && !SPACING.has(styles.spacing)) push(errors, `${path}.spacing`, "Unsupported spacing token.");
}

function validateOpenGraph(openGraph: unknown, path: string, errors: EditorDocumentValidationError[]): void {
  if (openGraph === undefined) return;
  if (!isRecord(openGraph)) {
    push(errors, path, "Open Graph metadata must be an object.");
    return;
  }
  (["title", "description", "url"] as const).forEach((key) => {
    if (typeof openGraph[key] !== "string") push(errors, `${path}.${key}`, "Open Graph metadata requires a string value.");
  });
  if (openGraph.type !== "website" && openGraph.type !== "article") {
    push(errors, `${path}.type`, "Open Graph metadata requires a supported type.");
  }
  if (openGraph.image !== undefined && typeof openGraph.image !== "string") {
    push(errors, `${path}.image`, "Open Graph image must be a string.");
  }
}

function validateNavigationItem(
  item: EditorNavigationItem,
  path: string,
  pageIds: Set<string>,
  nodeIds: Set<string>,
  errors: EditorDocumentValidationError[],
): void {
  if (!item.id) push(errors, `${path}.id`, "Navigation item IDs are required.");
  if (!item.label) push(errors, `${path}.label`, "Navigation item labels are required.");
  if (typeof item.visible !== "boolean") push(errors, `${path}.visible`, "Navigation visibility must be a boolean.");

  switch (item.target.kind) {
    case "page":
      if (!pageIds.has(item.target.pageId)) push(errors, `${path}.target.pageId`, "Navigation target page does not exist.");
      break;
    case "node":
      if (!nodeIds.has(item.target.nodeId)) push(errors, `${path}.target.nodeId`, "Navigation target node does not exist.");
      if (item.target.pageId && !pageIds.has(item.target.pageId)) push(errors, `${path}.target.pageId`, "Navigation target page does not exist.");
      break;
    case "external":
      if (!item.target.url) push(errors, `${path}.target.url`, "External navigation URL is required.");
      break;
    case "unresolved":
      if (!item.target.originalHref) push(errors, `${path}.target.originalHref`, "Unresolved navigation href is required.");
      break;
    default:
      push(errors, `${path}.target`, "Navigation target is invalid.");
  }

}

/**
 * Validates document graph integrity and, by default, the registered component
 * contract. Passing `registry: false` is useful only for low-level migration
 * diagnostics where an intentionally unregistered legacy node is expected.
 */
export function validateEditorDocument(
  document: EditorDocument,
  options: { registry?: ComponentRegistry | false } = {},
): EditorDocumentValidationError[] {
  const errors: EditorDocumentValidationError[] = [];

  if (document.schemaVersion !== EDITOR_DOCUMENT_SCHEMA_VERSION) {
    push(errors, "schemaVersion", `Expected schema version ${EDITOR_DOCUMENT_SCHEMA_VERSION}.`);
  }

  if (!document.id) push(errors, "id", "Document ID is required.");
  if (!document.site.name) push(errors, "site.name", "Site name is required.");
  validateSiteStyles(document.site.styles, "site.styles", errors);
  validateOpenGraph(document.site.seo.openGraph, "site.seo.openGraph", errors);

  const pageIds = new Set<string>();
  const pagePaths = new Set<string>();
  document.pages.forEach((page, index) => {
    const path = `pages.${index}`;
    if (!page.id || pageIds.has(page.id)) push(errors, `${path}.id`, "Page IDs must be unique and non-empty.");
    pageIds.add(page.id);
    if (!page.path.startsWith("/")) push(errors, `${path}.path`, "Page paths must start with '/'.");
    if (!page.path || pagePaths.has(page.path)) push(errors, `${path}.path`, "Page paths must be unique and non-empty.");
    pagePaths.add(page.path);
    validateVisibility(page.visibility, `${path}.visibility`, errors);
    validatePageStyles(page.styles, `${path}.styles`, errors);
    validateOpenGraph(page.seo.openGraph, `${path}.seo.openGraph`, errors);
  });

  const nodeIds = new Set(Object.keys(document.nodes));
  const childParentCounts = new Map<EditorNodeId, number>();
  const adjacency = new Map<EditorNodeId, EditorNodeId[]>();

  Object.entries(document.nodes).forEach(([nodeId, node]) => {
    const path = `nodes.${nodeId}`;
    if (!node.id || node.id !== nodeId) push(errors, `${path}.id`, "Node ID must match its document key.", nodeId);
    if (!node.type) push(errors, `${path}.type`, "Node type is required.", nodeId);
    validateVisibility(node.visibility, `${path}.visibility`, errors);
    validateNodeStyles(node.styles, `${path}.styles`, errors);
    validateEditorValue(node.props, `${path}.props`, errors);

    if (node.symbolReference && !document.globals.symbols[node.symbolReference.symbolId]) {
      push(errors, `${path}.symbolReference.symbolId`, "Node references a missing reusable symbol.", nodeId);
    }

    const children: EditorNodeId[] = [];
    Object.entries(node.slots).forEach(([slotName, slot]) => {
      const slotPath = `${path}.slots.${slotName}`;
      if (!slot || slot.name !== slotName) push(errors, `${slotPath}.name`, "Slot name must match its document key.");
      const seenChildren = new Set<string>();
      slot?.childIds.forEach((childId, childIndex) => {
        if (seenChildren.has(childId)) push(errors, `${slotPath}.childIds.${childIndex}`, "A slot cannot reference a child more than once.");
        seenChildren.add(childId);
        children.push(childId);
        childParentCounts.set(childId, (childParentCounts.get(childId) ?? 0) + 1);
        if (!nodeIds.has(childId)) push(errors, `${slotPath}.childIds.${childIndex}`, "Slot references a missing node.");
      });
    });
    adjacency.set(nodeId, children);
  });

  document.pages.forEach((page, index) => {
    const roots = new Set<string>();
    if (page.rootNodeIds.length === 0) {
      push(errors, `pages.${index}.rootNodeIds`, "Pages must reference at least one root node.");
    }
    page.rootNodeIds.forEach((rootId, rootIndex) => {
      if (roots.has(rootId)) push(errors, `pages.${index}.rootNodeIds.${rootIndex}`, "Page root references must be unique.");
      roots.add(rootId);
      if (!nodeIds.has(rootId)) push(errors, `pages.${index}.rootNodeIds.${rootIndex}`, "Page root references a missing node.");
    });
  });

  const globalComponentIds = new Set<string>();
  [document.globals.header, document.globals.footer]
    .filter((component): component is NonNullable<typeof component> => Boolean(component))
    .forEach((component) => {
      if (!component.id || globalComponentIds.has(component.id)) {
        push(errors, `globals.${component.role}.id`, "Global component IDs must be unique and non-empty.");
      }
      globalComponentIds.add(component.id);
      if (!nodeIds.has(component.nodeId)) push(errors, `globals.${component.role}.nodeId`, "Global component references a missing node.");
    });
  Object.entries(document.globals.symbols).forEach(([symbolId, symbol]) => {
    if (symbol.id !== symbolId) push(errors, `globals.symbols.${symbolId}.id`, "Symbol ID must match its document key.");
    if (!nodeIds.has(symbol.rootNodeId)) push(errors, `globals.symbols.${symbolId}.rootNodeId`, "Symbol references a missing node.");
  });

  childParentCounts.forEach((count, childId) => {
    if (count > 1) push(errors, `nodes.${childId}`, "A node cannot have more than one parent.");
  });

  const visited = new Set<EditorNodeId>();
  const visiting = new Set<EditorNodeId>();
  const visit = (nodeId: EditorNodeId, path: string): void => {
    if (visiting.has(nodeId)) {
      push(errors, path, "Node tree contains a cycle.");
      return;
    }
    if (visited.has(nodeId) || !nodeIds.has(nodeId)) return;
    visiting.add(nodeId);
    (adjacency.get(nodeId) ?? []).forEach((childId, index) => visit(childId, `${path}.childIds.${index}`));
    visiting.delete(nodeId);
    visited.add(nodeId);
  };
  nodeIds.forEach((nodeId) => visit(nodeId, `nodes.${nodeId}`));

  document.navigation.menus.forEach((menu, menuIndex) => {
    const itemIds = new Set<string>();
    const visitMenuItem = (item: EditorNavigationItem, path: string): void => {
      if (itemIds.has(item.id)) push(errors, `${path}.id`, "Navigation item IDs must be unique within a menu.");
      itemIds.add(item.id);
      validateNavigationItem(item, path, pageIds, nodeIds, errors);
      item.children.forEach((child, childIndex) =>
        visitMenuItem(child, `${path}.children.${childIndex}`),
      );
    };
    menu.items.forEach((item, itemIndex) => visitMenuItem(item, `navigation.menus.${menuIndex}.items.${itemIndex}`));
  });

  if (document.navigation.activePageId && !pageIds.has(document.navigation.activePageId)) {
    push(errors, "navigation.activePageId", "Active navigation page does not exist.");
  }

  Object.entries(document.assets).forEach(([assetId, asset]) => {
    if (asset.id !== assetId) push(errors, `assets.${assetId}.id`, "Asset ID must match its document key.");
    if (!asset.url) push(errors, `assets.${assetId}.url`, "Asset URL is required.");
  });

  if (options.registry !== false) {
    errors.push(...validateEditorDocumentRegistry(document, options.registry ?? editorComponentRegistry));
  }

  return errors;
}

import type {
  GeneratedPageMetadata,
  GeneratedSiteMetadata,
  WebsiteSeoMetadataRow,
  WebsiteSeoPackage,
} from "@/lib/ai/seo";
import type {
  NavigationMenu,
  NavigationMenuItem,
  PageHierarchyNode,
  WebsiteNavigation,
} from "@/lib/ai/navigation";
import type {
  ContentVariation,
  PageType,
  WebsiteComponent,
  WebsitePage,
  WebsiteSection,
  WebsiteStructure,
  WebsiteStructureStatus,
  WebsiteType,
} from "@/lib/ai/structure";
import type { SectionLayoutGroup, SectionLayoutNode, WebsiteLayoutModel } from "@/lib/ai/layout/types";
import type { WebsiteGenerationInput } from "@/lib/ai/prompts/types";
import { toSafeDocumentUrl } from "@/lib/editor/registry";
import { validateEditorDocument } from "./validation";
import type {
  DocumentOpenGraph,
  EditorDocument,
  EditorDocumentValidationError,
  EditorNavigationItem,
  EditorNode,
  EditorPage,
  EditorValue,
  EditorValueObject,
} from "./types";

/**
 * The only state that a canonical-document projection may carry forward from
 * persistence. Callers must construct this from a server-authorized row; no
 * field in this interface is accepted from an editor request.
 */
export interface TrustedWebsiteStructureState {
  structureId: string;
  userId: string;
  websiteType: WebsiteType;
  sourceInput: WebsiteGenerationInput;
  status: WebsiteStructureStatus;
  semanticVersion: number;
  generatedAt: string;
  updatedAt: string;
  contentVariations?: ContentVariation[];
  layout?: WebsiteLayoutModel;
  publication?: WebsiteStructure["publication"];
  management?: WebsiteStructure["management"];
  routing?: WebsiteStructure["routing"];
}

export type EditorProjectionIssueCode =
  | "document_invalid"
  | "identity_mismatch"
  | "unprojectable_node"
  | "unprojectable_layout"
  | "unprojectable_visibility"
  | "unprojectable_global"
  | "unprojectable_navigation"
  | "unprojectable_asset"
  | "unprojectable_seo";

export interface EditorProjectionIssue {
  code: EditorProjectionIssueCode;
  path: string;
  message: string;
  nodeId?: string;
}

export type EditorProjectionResult<T> =
  | { ok: true; value: T; issues: [] }
  | { ok: false; issues: EditorProjectionIssue[] };

export interface WebsiteSeoArtifactProjection {
  package: WebsiteSeoPackage;
  rows: WebsiteSeoMetadataRow[];
}

const PAGE_TYPES = new Set<PageType>(["home", "about", "services", "contact", "custom"]);
const PROJECTABLE_SECTION_PREFIX = "section.";
const PROJECTABLE_COMPONENT_PREFIX = "component.";
const PROJECTABLE_SECTION_TYPES = new Set([
  "hero",
  "about",
  "services",
  "features",
  "benefits",
  "testimonials",
  "faq",
  "pricing",
  "cta",
  "contact",
  "footer",
]);
const PROJECTABLE_COMPONENT_TYPES = new Set([
  "heading",
  "paragraph",
  "button",
  "image",
  "list",
  "card",
  "form",
]);

function clone<T>(value: T): T {
  return structuredClone(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isEditorValueObject(value: EditorValue | undefined): value is EditorValueObject {
  return isRecord(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function issue(
  issues: EditorProjectionIssue[],
  code: EditorProjectionIssueCode,
  path: string,
  message: string,
  nodeId?: string,
): void {
  issues.push({ code, path, message, ...(nodeId ? { nodeId } : {}) });
}

function documentValidationIssues(errors: EditorDocumentValidationError[]): EditorProjectionIssue[] {
  return errors.map((error) => ({
    code: "document_invalid",
    path: error.path,
    message: error.message,
    ...(error.nodeId ? { nodeId: error.nodeId } : {}),
  }));
}

function hasResponsiveOverrides(visibility: { desktop?: boolean; tablet?: boolean; mobile?: boolean }): boolean {
  return visibility.desktop !== undefined || visibility.tablet !== undefined || visibility.mobile !== undefined;
}

function toLegacySectionType(node: EditorNode): string | undefined {
  if (node.type.startsWith("legacy.section.")) {
    return node.legacy?.sourceType;
  }

  if (node.type.startsWith(PROJECTABLE_SECTION_PREFIX)) {
    return node.legacy?.sourceType ?? node.type.slice(PROJECTABLE_SECTION_PREFIX.length);
  }

  return undefined;
}

function toLegacyComponentType(node: EditorNode): string | undefined {
  if (node.type.startsWith("legacy.component.")) {
    return node.legacy?.sourceType;
  }

  if (node.type.startsWith(PROJECTABLE_COMPONENT_PREFIX)) {
    return node.legacy?.sourceType ?? node.type.slice(PROJECTABLE_COMPONENT_PREFIX.length);
  }

  return undefined;
}

function getSectionContent(node: EditorNode): Record<string, unknown> | undefined {
  return isEditorValueObject(node.props.content) ? clone(node.props.content) : undefined;
}

function getStyleHints(node: EditorNode): WebsiteSection["styleHints"] | undefined {
  if (!isEditorValueObject(node.props.styleHints)) {
    return undefined;
  }

  return clone(node.props.styleHints) as WebsiteSection["styleHints"];
}

function resolveComponentProps(document: EditorDocument, node: EditorNode): EditorValueObject {
  const props = clone(node.props);
  const assetId = typeof props.src === "string" ? props.src : undefined;

  if (node.type === "component.image" && assetId && document.assets[assetId]) {
    props.src = document.assets[assetId].url;
    if (typeof props.alt !== "string" && document.assets[assetId].alt) {
      props.alt = document.assets[assetId].alt;
    }
  }

  return props;
}

function projectSection(
  document: EditorDocument,
  node: EditorNode,
  order: number,
  issues: EditorProjectionIssue[],
): WebsiteSection | undefined {
  const sectionType = toLegacySectionType(node);
  if (
    !sectionType ||
    (node.kind !== "section" && node.kind !== "legacy") ||
    (node.type.startsWith(PROJECTABLE_SECTION_PREFIX) &&
      !node.legacy?.sourceType &&
      !PROJECTABLE_SECTION_TYPES.has(sectionType))
  ) {
    issue(issues, "unprojectable_node", `nodes.${node.id}`, "Node cannot be represented as a legacy website section.", node.id);
    return undefined;
  }
  if (!node.legacy?.sourceId) {
    issue(issues, "unprojectable_node", `nodes.${node.id}.legacy.sourceId`, "Sections require a stable legacy source ID during the compatibility transition.", node.id);
    return undefined;
  }
  if (hasResponsiveOverrides(node.visibility)) {
    issue(issues, "unprojectable_visibility", `nodes.${node.id}.visibility`, "Breakpoint-specific section visibility is not supported by WebsiteStructure.", node.id);
  }
  if (node.styles && Object.keys(node.styles).length > 0) {
    issue(issues, "unprojectable_layout", `nodes.${node.id}.styles`, "Section style tokens do not yet have a lossless WebsiteStructure representation.", node.id);
  }

  const content = getSectionContent(node);
  if (!content) {
    issue(issues, "unprojectable_node", `nodes.${node.id}.props.content`, "Sections require JSON object content for WebsiteStructure compatibility.", node.id);
    return undefined;
  }

  const allowedSlots = new Set(["default", "components"]);
  Object.entries(node.slots).forEach(([slotName, slot]) => {
    if (!allowedSlots.has(slotName)) {
      issue(issues, "unprojectable_node", `nodes.${node.id}.slots.${slotName}`, "This section slot has no WebsiteStructure compatibility representation.", node.id);
    }
    if (slotName === "default" && slot.childIds.length > 0) {
      issue(issues, "unprojectable_layout", `nodes.${node.id}.slots.default`, "Nested section containers are deferred until the production renderer supports them.", node.id);
    }
  });

  const componentIds = node.slots.components?.childIds ?? [];
  const components: WebsiteComponent[] = [];
  componentIds.forEach((componentId) => {
    const component = document.nodes[componentId];
    if (!component) return;
    const componentType = toLegacyComponentType(component);
    if (
      !componentType ||
      (!PROJECTABLE_COMPONENT_TYPES.has(componentType) && !component.type.startsWith("legacy.component."))
    ) {
      issue(issues, "unprojectable_node", `nodes.${node.id}.slots.components`, "Component type has no WebsiteStructure compatibility representation.", component.id);
      return;
    }
    if (!component.legacy?.sourceId) {
      issue(issues, "unprojectable_node", `nodes.${component.id}.legacy.sourceId`, "Components require a stable legacy source ID during the compatibility transition.", component.id);
      return;
    }
    if (hasResponsiveOverrides(component.visibility) || component.visibility.base !== true) {
      issue(issues, "unprojectable_visibility", `nodes.${component.id}.visibility`, "WebsiteStructure components do not support independent visibility.", component.id);
    }
    if (component.styles && Object.keys(component.styles).length > 0) {
      issue(issues, "unprojectable_layout", `nodes.${component.id}.styles`, "Component style tokens do not yet have a lossless WebsiteStructure representation.", component.id);
    }
    if (Object.values(component.slots).some((slot) => slot.childIds.length > 0)) {
      issue(issues, "unprojectable_layout", `nodes.${component.id}.slots`, "Nested component children are deferred until the production renderer supports them.", component.id);
    }

    components.push({
      id: component.legacy.sourceId,
      type: componentType as WebsiteComponent["type"],
      props: resolveComponentProps(document, component),
    });
  });

  if (Array.isArray(node.props.components) && componentIds.length === 0 && node.props.components.length > 0) {
    issue(issues, "unprojectable_node", `nodes.${node.id}.props.components`, "Compatibility components must be represented by ordered component slot children.", node.id);
  }

  return {
    id: node.legacy.sourceId,
    type: sectionType as WebsiteSection["type"],
    order,
    visible: node.visibility.base,
    content,
    ...(components.length ? { components } : {}),
    ...(getStyleHints(node) ? { styleHints: getStyleHints(node) } : {}),
  };
}

function sectionOrders(nodes: EditorNode[]): number[] {
  const legacyOrders = nodes.map((node) => node.props.legacyOrder);
  const allNumeric = legacyOrders.every((value) => typeof value === "number" && Number.isFinite(value));
  const strictlyIncreasing = allNumeric && legacyOrders.every((value, index) => index === 0 || (value as number) > (legacyOrders[index - 1] as number));

  return strictlyIncreasing ? (legacyOrders as number[]) : nodes.map((_, index) => index);
}

function pageType(page: EditorPage, issues: EditorProjectionIssue[], pageIndex: number): PageType | undefined {
  const type = page.legacyPageType;
  if (type && PAGE_TYPES.has(type as PageType)) {
    return type as PageType;
  }

  issue(issues, "unprojectable_node", `pages.${pageIndex}.legacyPageType`, "Pages require a supported legacy page type during the compatibility transition.");
  return undefined;
}

function buildPageDepths(pages: EditorPage[], issues: EditorProjectionIssue[]): Map<string, number> {
  const byId = new Map(pages.map((page) => [page.id, page]));
  const depths = new Map<string, number>();
  const visiting = new Set<string>();

  const visit = (page: EditorPage): number => {
    const cached = depths.get(page.id);
    if (cached !== undefined) return cached;
    if (visiting.has(page.id)) {
      issue(issues, "unprojectable_navigation", `pages.${page.id}.navigation.parentPageId`, "Page navigation parents cannot form a cycle.");
      return 0;
    }
    visiting.add(page.id);
    const parentId = page.navigation.parentPageId;
    const parent = parentId ? byId.get(parentId) : undefined;
    if (parentId && !parent) {
      issue(issues, "unprojectable_navigation", `pages.${page.id}.navigation.parentPageId`, "Page navigation parent does not exist.");
    }
    const depth = parent ? visit(parent) + 1 : 0;
    visiting.delete(page.id);
    depths.set(page.id, depth);
    return depth;
  };

  pages.forEach(visit);
  return depths;
}

function projectPages(
  document: EditorDocument,
  issues: EditorProjectionIssue[],
  hasTrustedLayout: boolean,
): WebsitePage[] {
  const pages = [...document.pages].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  const depths = buildPageDepths(pages, issues);

  return pages.flatMap((page, pageIndex) => {
    if (hasResponsiveOverrides(page.visibility)) {
      issue(issues, "unprojectable_visibility", `pages.${pageIndex}.visibility`, "Breakpoint-specific page visibility is not supported by WebsiteStructure.");
    }
    if (page.styles && Object.keys(page.styles).length > 0 && !hasTrustedLayout) {
      issue(issues, "unprojectable_layout", `pages.${pageIndex}.styles`, "Page style changes need a legacy layout projection and are deferred in Slice 3A.");
    }
    if (page.rootNodeIds.length !== 1) {
      issue(issues, "unprojectable_layout", `pages.${pageIndex}.rootNodeIds`, "A legacy page must have exactly one page-root node.");
      return [];
    }

    const root = document.nodes[page.rootNodeIds[0]];
    if (!root || root.type !== "layout.page-root" || root.kind !== "container") {
      issue(issues, "unprojectable_layout", `pages.${pageIndex}.rootNodeIds.0`, "Page root is not representable by WebsiteStructure.", root?.id);
      return [];
    }
    if (root.visibility.base !== page.visibility.base || hasResponsiveOverrides(root.visibility)) {
      issue(issues, "unprojectable_visibility", `nodes.${root.id}.visibility`, "Page-root visibility must match the legacy page visibility.", root.id);
    }
    if ((root.styles && Object.keys(root.styles).length > 0) || Object.keys(root.props).length > 0) {
      issue(issues, "unprojectable_layout", `nodes.${root.id}`, "Page-root props and style tokens are not represented in WebsiteStructure.", root.id);
    }
    const unsupportedRootSlots = Object.entries(root.slots).filter(([slotName]) => slotName !== "default");
    unsupportedRootSlots.forEach(([slotName]) => {
      issue(issues, "unprojectable_layout", `nodes.${root.id}.slots.${slotName}`, "Page-root slot is not supported by WebsiteStructure.", root.id);
    });

    const sectionNodes = (root.slots.default?.childIds ?? [])
      .map((nodeId) => document.nodes[nodeId])
      .filter((node): node is EditorNode => Boolean(node));
    if (sectionNodes.length === 0) {
      issue(issues, "unprojectable_layout", `nodes.${root.id}.slots.default`, "WebsiteStructure pages require at least one section.", root.id);
    }
    const orders = sectionOrders(sectionNodes);
    const sections = sectionNodes.flatMap((node, index) => {
      const section = projectSection(document, node, orders[index], issues);
      return section ? [section] : [];
    });
    const type = pageType(page, issues, pageIndex);
    if (!type) return [];

    return [{
      id: page.id,
      slug: page.path,
      title: page.name,
      type,
      sections,
      seo: {
        title: page.seo.title,
        description: page.seo.description,
        keywords: clone(page.seo.keywords),
        ...(page.seo.canonicalUrl ? { canonicalUrl: page.seo.canonicalUrl } : {}),
        ...(page.seo.openGraph ? { openGraph: clone(page.seo.openGraph) } : {}),
        ...getPageSeoCompatibilityExtensions(page.seo.extensions),
      },
      order: page.order,
      ...(page.navigation.parentPageId !== undefined ? { parentPageId: page.navigation.parentPageId } : {}),
      depth: depths.get(page.id) ?? 0,
      priority: page.navigation.priority ?? page.order,
      visible: page.visibility.base,
      navigation: {
        includeInHeader: page.navigation.includeInHeader,
        includeInFooter: page.navigation.includeInFooter,
        includeInSidebar: page.navigation.includeInSidebar,
      },
      ...(page.navigation.label ? { navigationLabel: page.navigation.label } : {}),
    }];
  });
}

function projectSectionLayoutNodes(
  layouts: SectionLayoutNode[],
  sectionsById: Map<string, WebsiteSection>,
): SectionLayoutNode[] {
  return layouts.flatMap((entry) => {
    const section = sectionsById.get(entry.sectionId);
    if (!section) return [];
    return [{
      ...entry,
      sectionType: section.type,
      order: section.order,
      visible: section.visible,
      metadata: {
        ...entry.metadata,
        ...(section.styleHints?.emphasis ? { emphasis: section.styleHints.emphasis } : {}),
        ...(section.styleHints?.layout ? { layoutHint: section.styleHints.layout } : {}),
      },
    }];
  });
}

function projectLayoutHierarchy(
  hierarchy: WebsiteLayoutModel["pages"][number]["hierarchy"],
  sectionsById: Map<string, WebsiteSection>,
): WebsiteLayoutModel["pages"][number]["hierarchy"] {
  const projected: Array<SectionLayoutNode | SectionLayoutGroup> = [];
  hierarchy.forEach((entry) => {
    if ("children" in entry) {
      const children = projectSectionLayoutNodes(entry.children, sectionsById);
      if (children.length) projected.push({ ...entry, children });
      return;
    }
    projected.push(...projectSectionLayoutNodes([entry], sectionsById));
  });
  return projected;
}

function projectTrustedLayout(
  document: EditorDocument,
  pages: WebsitePage[],
  trusted: TrustedWebsiteStructureState,
): WebsiteLayoutModel | undefined {
  if (!trusted.layout) {
    return undefined;
  }

  const documentPages = new Map(document.pages.map((page) => [page.id, page]));
  const projectedPages = new Map(pages.map((page) => [page.id, page]));
  return {
    ...clone(trusted.layout),
    structureId: trusted.structureId,
    websiteType: trusted.websiteType,
    pages: trusted.layout.pages.flatMap((layoutPage) => {
      const documentPage = documentPages.get(layoutPage.pageId);
      const projectedPage = projectedPages.get(layoutPage.pageId);
      if (!documentPage || !projectedPage) return [];
      const sectionsById = new Map(projectedPage.sections.map((section) => [section.id, section]));
      const sectionLayouts = layoutPage.sectionLayouts.flatMap((layout) => {
        const section = sectionsById.get(layout.sectionId);
        if (!section) return [];
        return [{
          ...layout,
          pageSlug: projectedPage.slug,
          sectionType: section.type,
          order: section.order,
          visible: section.visible,
          metadata: {
            ...layout.metadata,
            ...(section.styleHints?.emphasis ? { emphasis: section.styleHints.emphasis } : {}),
            ...(section.styleHints?.layout ? { layoutHint: section.styleHints.layout } : {}),
          },
        }];
      });
      return [{
        ...clone(layoutPage),
        pageSlug: projectedPage.slug,
        pageType: projectedPage.type,
        templateName: documentPage.styles?.template ?? layoutPage.templateName,
        sectionLayouts,
        hierarchy: projectLayoutHierarchy(layoutPage.hierarchy, sectionsById),
        metadata: {
          ...layoutPage.metadata,
          ...(documentPage.styles?.themeMode ? { themeMode: documentPage.styles.themeMode } : {}),
          ...(documentPage.styles?.spacing ? { spacingScale: documentPage.styles.spacing } : {}),
        },
      }];
    }),
  };
}

function getSeoExtension(
  extensions: EditorValueObject | undefined,
  key: "contentOptimization" | "searchIntent",
): unknown | undefined {
  return extensions && extensions[key] !== undefined ? clone(extensions[key]) : undefined;
}

function getPageSeoCompatibilityExtensions(
  extensions: EditorValueObject | undefined,
): Pick<WebsitePage["seo"], "contentOptimization" | "searchIntent"> {
  const contentOptimization = getSeoExtension(extensions, "contentOptimization");
  const searchIntent = getSeoExtension(extensions, "searchIntent");
  return {
    ...(contentOptimization !== undefined
      ? { contentOptimization: contentOptimization as NonNullable<WebsitePage["seo"]["contentOptimization"]> }
      : {}),
    ...(searchIntent !== undefined
      ? { searchIntent: searchIntent as NonNullable<WebsitePage["seo"]["searchIntent"]> }
      : {}),
  };
}

function getSiteSeoCompatibilityExtensions(
  extensions: EditorValueObject | undefined,
): Pick<WebsiteStructure["seo"], "contentOptimization" | "searchIntent"> {
  const contentOptimization = getSeoExtension(extensions, "contentOptimization");
  const searchIntent = getSeoExtension(extensions, "searchIntent");
  return {
    ...(contentOptimization !== undefined
      ? { contentOptimization: contentOptimization as NonNullable<WebsiteStructure["seo"]["contentOptimization"]> }
      : {}),
    ...(searchIntent !== undefined
      ? { searchIntent: searchIntent as NonNullable<WebsiteStructure["seo"]["searchIntent"]> }
      : {}),
  };
}

function anchorCandidates(node: EditorNode): string[] {
  const values = [node.legacy?.sourceId, node.legacy?.sourceType, node.id]
    .filter((value): value is string => Boolean(value));
  return [...new Set(values)];
}

function projectNavigationItem(
  document: EditorDocument,
  item: EditorNavigationItem,
  path: string,
  order: number,
  parentItemId: string | null,
  issues: EditorProjectionIssue[],
): NavigationMenuItem | undefined {
  let href: string | undefined;
  let pageId: string | undefined;
  let external = false;

  if (item.target.kind === "page") {
    const targetPageId = item.target.pageId;
    const page = document.pages.find((candidate) => candidate.id === targetPageId);
    if (!page) {
      issue(issues, "unprojectable_navigation", `${path}.target.pageId`, "Navigation target page does not exist.");
      return undefined;
    }
    href = page.path;
    pageId = page.id;
  } else if (item.target.kind === "node") {
    const node = document.nodes[item.target.nodeId];
    if (!node || !node.legacy?.sourceId) {
      issue(issues, "unprojectable_navigation", `${path}.target.nodeId`, "Navigation node target has no stable legacy anchor.");
      return undefined;
    }
    const preserved = item.legacyHref?.startsWith("#") && anchorCandidates(node).includes(item.legacyHref.slice(1))
      ? item.legacyHref
      : undefined;
    href = preserved ?? `#${node.legacy.sourceId}`;
  } else if (item.target.kind === "external") {
    href = toSafeDocumentUrl(item.target.url);
    external = true;
  } else {
    href = toSafeDocumentUrl(item.target.originalHref);
  }

  if (!href) {
    issue(issues, "unprojectable_navigation", `${path}.target`, "Navigation target cannot be represented as a safe legacy href.");
    return undefined;
  }

  const children = item.children.flatMap((child, index) => {
    const childItem = projectNavigationItem(document, child, `${path}.children.${index}`, index, item.id, issues);
    return childItem ? [childItem] : [];
  });

  return {
    id: item.id,
    label: item.label,
    href,
    ...(pageId ? { pageId } : {}),
    parentItemId,
    order,
    visible: item.visible,
    ...(external ? { external: true } : {}),
    ...(children.length ? { children } : {}),
  };
}

function flattenNavigation(items: NavigationMenuItem[]): WebsiteNavigation["primary"] {
  return items.flatMap((item) => [
    ...(item.visible ? [{ label: item.label, href: item.href, ...(item.pageId ? { pageId: item.pageId } : {}), ...(item.external ? { external: true } : {}) }] : []),
    ...flattenNavigation(item.children ?? []),
  ]);
}

function navigationStyle(location: NavigationMenu["location"]): NavigationMenu["style"] {
  switch (location) {
    case "footer":
      return "footer-nav";
    case "sidebar":
      return "sidebar-nav";
    default:
      return "top-nav";
  }
}

function buildHierarchy(
  document: EditorDocument,
  issues: EditorProjectionIssue[],
): NonNullable<WebsiteNavigation["hierarchy"]> {
  const pages = [...document.pages].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
  const depths = buildPageDepths(pages, issues);
  const nodes: PageHierarchyNode[] = pages.map((page) => ({
    pageId: page.id,
    slug: page.path,
    path: page.path,
    parentPageId: page.navigation.parentPageId ?? null,
    depth: depths.get(page.id) ?? 0,
    order: page.order,
    priority: page.navigation.priority ?? page.order,
    pageType: PAGE_TYPES.has(page.legacyPageType as PageType) ? page.legacyPageType as PageType : "custom",
    visible: page.visibility.base,
    navigation: {
      includeInHeader: page.navigation.includeInHeader,
      includeInFooter: page.navigation.includeInFooter,
      includeInSidebar: page.navigation.includeInSidebar,
    },
  }));

  return {
    rootPageIds: nodes.filter((node) => !node.parentPageId).map((node) => node.pageId),
    nodes,
    maxDepth: nodes.reduce((maximum, node) => Math.max(maximum, node.depth), 0),
  };
}

/** Projects typed document navigation into the existing WebsiteNavigation artifact shape. */
export function projectEditorDocumentNavigation(document: EditorDocument): EditorProjectionResult<WebsiteNavigation> {
  const issues = documentValidationIssues(validateEditorDocument(document));
  const menuIds = new Set<string>();
  const menus: NavigationMenu[] = [];

  document.navigation.menus.forEach((menu, menuIndex) => {
    if (menuIds.has(menu.id)) {
      issue(issues, "unprojectable_navigation", `navigation.menus.${menuIndex}.id`, "Legacy navigation menus require unique IDs.");
      return;
    }
    menuIds.add(menu.id);
    if (menu.location === "custom") {
      issue(issues, "unprojectable_navigation", `navigation.menus.${menuIndex}.location`, "Custom navigation locations have no WebsiteNavigation compatibility representation.");
      return;
    }
    const items = menu.items.flatMap((item, itemIndex) => {
      const projected = projectNavigationItem(document, item, `navigation.menus.${menuIndex}.items.${itemIndex}`, itemIndex, null, issues);
      return projected ? [projected] : [];
    });
    menus.push({ id: menu.id, location: menu.location, style: navigationStyle(menu.location), items });
  });

  const hierarchy = buildHierarchy(document, issues);
  const primaryMenu = menus.find((menu) => menu.location === "header");
  const footerMenu = menus.find((menu) => menu.location === "footer");
  const primary = primaryMenu ? flattenNavigation(primaryMenu.items) : hierarchy.nodes
    .filter((node) => node.navigation.includeInHeader && node.visible)
    .map((node) => ({ label: document.pages.find((page) => page.id === node.pageId)?.navigation.label ?? document.pages.find((page) => page.id === node.pageId)?.name ?? node.path, href: node.path, pageId: node.pageId }));
  const footer = footerMenu ? flattenNavigation(footerMenu.items) : hierarchy.nodes
    .filter((node) => node.navigation.includeInFooter && node.visible)
    .map((node) => ({ label: document.pages.find((page) => page.id === node.pageId)?.navigation.label ?? document.pages.find((page) => page.id === node.pageId)?.name ?? node.path, href: node.path, pageId: node.pageId }));

  if (primary.length === 0) {
    issue(issues, "unprojectable_navigation", "navigation", "WebsiteStructure requires at least one primary navigation item.");
  }

  const activePage = document.navigation.activePageId
    ? document.pages.find((page) => page.id === document.navigation.activePageId)
    : undefined;
  if (issues.length > 0) return { ok: false, issues };

  return {
    ok: true,
    value: {
      primary,
      ...(footer.length ? { footer } : {}),
      menus,
      hierarchy,
      activePath: activePage?.path ?? document.pages
        .slice()
        .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))[0]?.path ?? "/",
    },
    issues: [],
  };
}

function validateGlobals(document: EditorDocument, issues: EditorProjectionIssue[]): void {
  if (Object.keys(document.globals.symbols).length > 0) {
    issue(issues, "unprojectable_global", "globals.symbols", "Reusable symbols are deferred until WebsiteStructure has a compatibility representation.");
  }

  [document.globals.header, document.globals.footer].forEach((global) => {
    if (!global) return;
    const node = document.nodes[global.nodeId];
    if (!node || node.type !== `site.${global.role}` || node.kind !== "global") {
      issue(issues, "unprojectable_global", `globals.${global.role}`, "Global component cannot be represented by WebsiteStructure.", global.nodeId);
      return;
    }
    if (hasResponsiveOverrides(node.visibility) || node.visibility.base !== true || Object.keys(node.slots).length > 0 || (node.styles && Object.keys(node.styles).length > 0)) {
      issue(issues, "unprojectable_global", `nodes.${node.id}`, "Global layout or visibility overrides are deferred until WebsiteStructure supports them.", node.id);
    }
    if (global.role === "header") {
      const siteName = stringValue(node.props.siteName);
      const tagline = stringValue(node.props.tagline);
      if (siteName !== undefined && siteName !== document.site.name) {
        issue(issues, "unprojectable_global", `nodes.${node.id}.props.siteName`, "Header site name must match canonical site settings during the compatibility transition.", node.id);
      }
      if (tagline !== undefined && tagline !== document.site.tagline) {
        issue(issues, "unprojectable_global", `nodes.${node.id}.props.tagline`, "Header tagline must match canonical site settings during the compatibility transition.", node.id);
      }
    }
  });
}

/**
 * Returns all conditions that would prevent a lossless EditorDocument →
 * WebsiteStructure compatibility projection. It never changes the document.
 */
export function getEditorDocumentProjectabilityIssues(
  document: EditorDocument,
  trusted: TrustedWebsiteStructureState,
): EditorProjectionIssue[] {
  const issues = documentValidationIssues(validateEditorDocument(document));
  if (document.compatibility.structureId !== trusted.structureId) {
    issue(issues, "identity_mismatch", "compatibility.structureId", "Document structure ID does not match the trusted server structure.");
  }
  validateGlobals(document, issues);
  const pages = projectPages(document, issues, Boolean(trusted.layout));
  projectTrustedLayout(document, pages, trusted);
  const navigation = projectEditorDocumentNavigation(document);
  if (!navigation.ok) issues.push(...navigation.issues.filter((entry) => entry.code !== "document_invalid"));
  return issues;
}

/**
 * Projects the canonical document to the currently active WebsiteStructure
 * renderer format. Trusted state is supplied explicitly so browser-controlled
 * document data can never set ownership, lifecycle, source, or timestamps.
 */
export function projectEditorDocumentToWebsiteStructure(
  document: EditorDocument,
  trusted: TrustedWebsiteStructureState,
): EditorProjectionResult<WebsiteStructure> {
  const issues = documentValidationIssues(validateEditorDocument(document));
  if (document.compatibility.structureId !== trusted.structureId) {
    issue(issues, "identity_mismatch", "compatibility.structureId", "Document structure ID does not match the trusted server structure.");
  }
  validateGlobals(document, issues);
  const pages = projectPages(document, issues, Boolean(trusted.layout));
  const layout = projectTrustedLayout(document, pages, trusted);
  const navigation = projectEditorDocumentNavigation(document);
  if (!navigation.ok) issues.push(...navigation.issues.filter((entry) => entry.code !== "document_invalid"));

  if (issues.length > 0 || !navigation.ok) {
    return { ok: false, issues };
  }

  return {
    ok: true,
    value: {
      id: trusted.structureId,
      userId: trusted.userId,
      websiteType: trusted.websiteType,
      siteTitle: document.site.name,
      tagline: document.site.tagline ?? "",
      pages,
      navigation: navigation.value,
      seo: {
        title: document.site.seo.title,
        description: document.site.seo.description,
        keywords: clone(document.site.seo.keywords),
        ...(document.site.seo.canonicalBaseUrl ? { canonicalBaseUrl: document.site.seo.canonicalBaseUrl } : {}),
        ...(document.site.seo.openGraph ? { openGraph: clone(document.site.seo.openGraph) } : {}),
        ...getSiteSeoCompatibilityExtensions(document.site.seo.extensions),
      },
      styleConfig: {
        tone: document.site.styles.tone,
        style: document.site.styles.visualStyle,
        colorMood: document.site.styles.colorMood ?? "",
        typographyMood: document.site.styles.typographyMood ?? "",
      },
      ...(trusted.contentVariations ? { contentVariations: clone(trusted.contentVariations) } : {}),
      ...(layout ? { layout } : {}),
      ...(trusted.publication ? { publication: clone(trusted.publication) } : {}),
      ...(trusted.management ? { management: clone(trusted.management) } : {}),
      ...(trusted.routing ? { routing: clone(trusted.routing) } : {}),
      sourceInput: clone(trusted.sourceInput),
      status: trusted.status,
      version: trusted.semanticVersion,
      generatedAt: trusted.generatedAt,
      updatedAt: trusted.updatedAt,
    },
    issues: [],
  };
}

function canonicalBaseUrl(document: EditorDocument): string | undefined {
  const value = document.site.seo.canonicalBaseUrl;
  if (value && toSafeDocumentUrl(value)) return value.replace(/\/+$/, "");

  const ogUrl = document.site.seo.openGraph?.url;
  if (ogUrl && /^https?:\/\//i.test(ogUrl)) {
    try {
      return new URL(ogUrl).origin;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function buildPageCanonicalUrl(baseUrl: string, path: string): string {
  const root = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  if (path === "/") return new URL("/", root).toString();
  return new URL(path.startsWith("/") ? path.slice(1) : path, root).toString();
}

function defaultOpenGraph(title: string, description: string, url: string, image?: string): DocumentOpenGraph {
  return { title, description, type: "website", url, ...(image ? { image } : {}) };
}

function seoRowId(structureId: string, pageSlug: string): string {
  return `${structureId}:${Buffer.from(pageSlug, "utf8").toString("base64url")}`;
}

/** Projects canonical SEO into the current package and row contracts without writing anything. */
export function projectEditorDocumentSeo(
  document: EditorDocument,
  trusted: TrustedWebsiteStructureState,
): EditorProjectionResult<WebsiteSeoArtifactProjection> {
  const issues = getEditorDocumentProjectabilityIssues(document, trusted);
  const baseUrl = canonicalBaseUrl(document);
  if (!baseUrl) {
    issue(issues, "unprojectable_seo", "site.seo.canonicalBaseUrl", "A canonical base URL is required to create current SEO metadata artifacts.");
  }
  if (issues.length > 0 || !baseUrl) return { ok: false, issues };

  const site: GeneratedSiteMetadata = {
    title: document.site.seo.title,
    description: document.site.seo.description,
    keywords: clone(document.site.seo.keywords),
    canonicalBaseUrl: baseUrl,
    defaultOpenGraph: document.site.seo.openGraph
      ? clone(document.site.seo.openGraph)
      : defaultOpenGraph(document.site.seo.title, document.site.seo.description, baseUrl),
  };
  const pages: GeneratedPageMetadata[] = [...document.pages]
    .sort((left, right) => left.order - right.order || left.id.localeCompare(right.id))
    .map((page) => {
      const canonicalUrl = page.seo.canonicalUrl ?? buildPageCanonicalUrl(baseUrl, page.path);
      return {
        pageSlug: page.path,
        pageType: (PAGE_TYPES.has(page.legacyPageType as PageType) ? page.legacyPageType : "custom") as PageType,
        title: page.seo.title,
        description: page.seo.description,
        keywords: clone(page.seo.keywords),
        canonicalUrl,
        openGraph: page.seo.openGraph
          ? clone(page.seo.openGraph)
          : defaultOpenGraph(page.seo.title, page.seo.description, canonicalUrl),
      };
    });
  const artifactPackage: WebsiteSeoPackage = {
    id: `wseo_${trusted.structureId}_v${trusted.semanticVersion}`,
    structureId: trusted.structureId,
    userId: trusted.userId,
    websiteType: trusted.websiteType,
    site,
    pages,
    generatedFromInput: clone(trusted.sourceInput),
    generatedAt: trusted.generatedAt,
    updatedAt: trusted.updatedAt,
    version: trusted.semanticVersion,
  };
  const rowBase = {
    structure_id: trusted.structureId,
    user_id: trusted.userId,
    content_status: trusted.semanticVersion > 1 ? "edited" as const : "generated" as const,
    created_by: trusted.userId,
    updated_by: trusted.userId,
    generated_from_input: clone(trusted.sourceInput),
    version: trusted.semanticVersion,
    archived_at: null,
    deleted_at: null,
    created_at: trusted.generatedAt,
    updated_at: trusted.updatedAt,
  };
  const rows: WebsiteSeoMetadataRow[] = [
    {
      ...rowBase,
      id: seoRowId(trusted.structureId, "__site__"),
      page_slug: "__site__",
      metadata_json: site,
    },
    ...pages.map((page) => ({
      ...rowBase,
      id: seoRowId(trusted.structureId, page.pageSlug),
      page_slug: page.pageSlug,
      metadata_json: page,
    })),
  ];

  return { ok: true, value: { package: artifactPackage, rows }, issues: [] };
}

/** Creates an explicit trusted-state boundary from an already-authorized database structure. */
export function trustedWebsiteStructureState(structure: WebsiteStructure): TrustedWebsiteStructureState {
  return {
    structureId: structure.id,
    userId: structure.userId,
    websiteType: structure.websiteType,
    sourceInput: clone(structure.sourceInput),
    status: structure.status,
    semanticVersion: structure.version,
    generatedAt: structure.generatedAt,
    updatedAt: structure.updatedAt,
    ...(structure.contentVariations ? { contentVariations: clone(structure.contentVariations) } : {}),
    ...(structure.layout ? { layout: clone(structure.layout) } : {}),
    ...(structure.publication ? { publication: clone(structure.publication) } : {}),
    ...(structure.management ? { management: clone(structure.management) } : {}),
    ...(structure.routing ? { routing: clone(structure.routing) } : {}),
  };
}

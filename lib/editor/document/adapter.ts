import type { WebsiteNavigation, WebsiteSection, WebsiteStructure } from "@/lib/ai/structure";
import {
  EDITOR_DOCUMENT_SCHEMA_VERSION,
  type DocumentOpenGraph,
  type DocumentPageSeo,
  type DocumentSiteSeo,
  type EditorAssetId,
  type EditorAssetReference,
  type EditorDocument,
  type EditorNavigationItem,
  type EditorNavigationMenu,
  type EditorNavigationTarget,
  type EditorNode,
  type EditorNodeId,
  type EditorPage,
  type EditorValue,
  type EditorValueObject,
  type PageNavigationIntent,
  type ResponsiveVisibility,
  type SiteStyleTokens,
} from "./types";

const RECOGNIZED_SECTION_TYPES = new Set([
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

type SectionReference = {
  nodeId: EditorNodeId;
  pageId: string;
};

interface NavigationResolutionContext {
  pageIds: Set<string>;
  pageIdByPath: Map<string, string>;
  sectionByAnchor: Map<string, SectionReference>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeToken(value: string): string {
  return value.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "unknown";
}

function deterministicNodeId(preferred: string, usedIds: Set<string>, fallback: string): string {
  const candidate = preferred.trim() || fallback;
  if (!usedIds.has(candidate)) {
    usedIds.add(candidate);
    return candidate;
  }

  let suffix = 2;
  let next = `${fallback}-${suffix}`;
  while (usedIds.has(next)) {
    suffix += 1;
    next = `${fallback}-${suffix}`;
  }
  usedIds.add(next);
  return next;
}

function ordered<T extends { id: string; order: number }>(items: readonly T[]): T[] {
  return [...items].sort((left, right) => left.order - right.order || left.id.localeCompare(right.id));
}

/** Converts unknown legacy JSON into a JSON-only value, with deterministic key order. */
function toEditorValue(value: unknown): EditorValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : String(value);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => toEditorValue(entry));
  }

  if (isRecord(value)) {
    return Object.keys(value)
      .sort((left, right) => left.localeCompare(right))
      .reduce<EditorValueObject>((result, key) => {
        result[key] = toEditorValue(value[key]);
        return result;
      }, {});
  }

  // Generated structures are JSON-backed. Preserve any unexpected runtime
  // value as a non-executable compatibility marker instead of silently
  // dropping content from a legacy website.
  return `[unsupported legacy value: ${typeof value}]`;
}

function toVisibility(visible: boolean | undefined): ResponsiveVisibility {
  return { base: visible !== false };
}

function copyOpenGraph(value: unknown): DocumentOpenGraph | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const title = typeof value.title === "string" ? value.title : undefined;
  const description = typeof value.description === "string" ? value.description : undefined;
  const url = typeof value.url === "string" ? value.url : undefined;
  const type = value.type === "article" ? "article" : value.type === "website" ? "website" : undefined;

  if (!title || !description || !url || !type) {
    return undefined;
  }

  return {
    title,
    description,
    type,
    url,
    ...(typeof value.image === "string" ? { image: value.image } : {}),
  };
}

function toSiteSeo(structure: WebsiteStructure): DocumentSiteSeo {
  return {
    title: structure.seo.title,
    description: structure.seo.description,
    keywords: [...structure.seo.keywords],
    ...(structure.seo.canonicalBaseUrl ? { canonicalBaseUrl: structure.seo.canonicalBaseUrl } : {}),
    ...(copyOpenGraph(structure.seo.openGraph) ? { openGraph: copyOpenGraph(structure.seo.openGraph) } : {}),
    ...(structure.seo.contentOptimization || structure.seo.searchIntent
      ? {
          extensions: {
            ...(structure.seo.contentOptimization
              ? { contentOptimization: toEditorValue(structure.seo.contentOptimization) }
              : {}),
            ...(structure.seo.searchIntent ? { searchIntent: toEditorValue(structure.seo.searchIntent) } : {}),
          },
        }
      : {}),
  };
}

function toPageSeo(page: WebsiteStructure["pages"][number]): DocumentPageSeo {
  return {
    title: page.seo.title,
    description: page.seo.description,
    keywords: [...page.seo.keywords],
    ...(page.seo.canonicalUrl ? { canonicalUrl: page.seo.canonicalUrl } : {}),
    ...(copyOpenGraph(page.seo.openGraph) ? { openGraph: copyOpenGraph(page.seo.openGraph) } : {}),
    ...(page.seo.contentOptimization || page.seo.searchIntent
      ? {
          extensions: {
            ...(page.seo.contentOptimization
              ? { contentOptimization: toEditorValue(page.seo.contentOptimization) }
              : {}),
            ...(page.seo.searchIntent ? { searchIntent: toEditorValue(page.seo.searchIntent) } : {}),
          },
        }
      : {}),
  };
}

function toSiteStyles(structure: WebsiteStructure): SiteStyleTokens {
  const firstLayout = structure.layout?.pages[0];
  return {
    tone: structure.styleConfig.tone,
    visualStyle: structure.styleConfig.style,
    themeMode: firstLayout?.metadata.themeMode ?? "auto",
    spacing: firstLayout?.metadata.spacingScale ?? "comfortable",
    colorMood: structure.styleConfig.colorMood,
    typographyMood: structure.styleConfig.typographyMood,
  };
}

function toPageNavigationIntent(page: WebsiteStructure["pages"][number]): PageNavigationIntent {
  return {
    ...(page.navigationLabel ? { label: page.navigationLabel } : {}),
    includeInHeader: page.navigation?.includeInHeader ?? true,
    includeInFooter: page.navigation?.includeInFooter ?? true,
    includeInSidebar: page.navigation?.includeInSidebar ?? Boolean(page.parentPageId),
    ...(page.parentPageId !== undefined ? { parentPageId: page.parentPageId } : {}),
    ...(typeof page.priority === "number" ? { priority: page.priority } : {}),
  };
}

function collectAssets(
  value: unknown,
  nodeId: EditorNodeId,
  path: string,
  assets: Record<EditorAssetId, EditorAssetReference>,
  assetIds: EditorAssetId[],
): void {
  if (Array.isArray(value)) {
    value.forEach((entry, index) => collectAssets(entry, nodeId, `${path}.${index}`, assets, assetIds));
    return;
  }

  if (!isRecord(value)) {
    return;
  }

  if (typeof value.src === "string" && value.src) {
    const assetId = `legacy:${nodeId}:asset:${sanitizeToken(path)}`;
    assets[assetId] = {
      id: assetId,
      source: value.src.startsWith("http://") || value.src.startsWith("https://") ? "external" : "legacy",
      url: value.src,
      ...(typeof value.alt === "string" ? { alt: value.alt } : {}),
    };
    assetIds.push(assetId);
  }

  Object.entries(value).forEach(([key, entry]) => {
    collectAssets(entry, nodeId, path ? `${path}.${key}` : key, assets, assetIds);
  });
}

function toSectionNode(
  section: WebsiteSection,
  pageId: string,
  structureId: string,
  usedNodeIds: Set<string>,
  assets: Record<EditorAssetId, EditorAssetReference>,
  legacyLayout?: unknown,
): EditorNode {
  const nodeId = deterministicNodeId(
    section.id,
    usedNodeIds,
    `legacy:${structureId}:page:${pageId}:section:${sanitizeToken(section.id)}`,
  );
  const sourceType = String(section.type);
  const recognized = RECOGNIZED_SECTION_TYPES.has(sourceType);
  const assetIds: EditorAssetId[] = [];
  collectAssets(section.content, nodeId, "content", assets, assetIds);

  const node: EditorNode = {
    id: nodeId,
    type: recognized ? `section.${sourceType}` : `legacy.section.${sanitizeToken(sourceType)}`,
    kind: recognized ? "section" : "legacy",
    props: {
      content: toEditorValue(section.content),
      ...(section.styleHints ? { styleHints: toEditorValue(section.styleHints) } : {}),
      ...(legacyLayout && isRecord(legacyLayout)
        ? { legacyLayout: toEditorValue(legacyLayout) }
        : {}),
      legacyOrder: section.order,
    },
    visibility: toVisibility(section.visible),
    slots: {},
    ...(assetIds.length ? { assetIds } : {}),
    legacy: {
      source: "website-structure",
      sourceId: section.id,
      sourceType,
      ...(recognized ? {} : { unsupported: true }),
    },
  };

  const components = section.components ?? [];
  if (components.length) {
    node.slots.components = { name: "components", childIds: [] };
    components.forEach((component, index) => {
      const componentNodeId = deterministicNodeId(
        component.id,
        usedNodeIds,
        `legacy:${nodeId}:component:${index + 1}`,
      );
      node.slots.components.childIds.push(componentNodeId);
      const componentAssetIds: EditorAssetId[] = [];
      collectAssets(component.props, componentNodeId, "props", assets, componentAssetIds);
      // The caller adds component nodes after the section node is returned.
      (node.props.components as EditorValue[] | undefined) ??= [];
      (node.props.components as EditorValue[]).push({
        id: componentNodeId,
        type: component.type,
        props: toEditorValue(component.props),
        ...(componentAssetIds.length ? { assetIds: componentAssetIds } : {}),
      });
    });
  }

  return node;
}

function createComponentNodesFromSectionNode(sectionNode: EditorNode): EditorNode[] {
  const components = Array.isArray(sectionNode.props.components) ? sectionNode.props.components : [];

  return components.flatMap((component): EditorNode[] => {
    if (!isRecord(component) || typeof component.id !== "string" || typeof component.type !== "string") {
      return [];
    }

    return [
      {
        id: component.id,
        type: `component.${sanitizeToken(component.type)}`,
        kind: "component",
        props: isRecord(component.props) ? (component.props as EditorValueObject) : {},
        visibility: { base: true },
        slots: {},
        ...(Array.isArray(component.assetIds)
          ? { assetIds: component.assetIds.filter((assetId): assetId is string => typeof assetId === "string") }
          : {}),
        legacy: {
          source: "website-structure",
          sourceId: component.id,
          sourceType: component.type,
          ...(component.type === "custom" ? { unsupported: true } : {}),
        },
      },
    ];
  });
}

function resolveNavigationTarget(
  item: { href: string; pageId?: string; external?: boolean },
  context: NavigationResolutionContext,
): EditorNavigationTarget {
  if (item.pageId && context.pageIds.has(item.pageId)) {
    return { kind: "page", pageId: item.pageId };
  }

  if (!item.external) {
    const pageId = context.pageIdByPath.get(item.href);
    if (pageId) {
      return { kind: "page", pageId };
    }

    if (item.href.startsWith("#")) {
      const section = context.sectionByAnchor.get(item.href.slice(1));
      if (section) {
        return { kind: "node", nodeId: section.nodeId, pageId: section.pageId };
      }
    }
  }

  if (item.external || /^(https?:|mailto:|tel:)/i.test(item.href)) {
    return { kind: "external", url: item.href };
  }

  return { kind: "unresolved", originalHref: item.href };
}

function toNavigationItem(
  item: WebsiteNavigation["primary"][number] & { id?: string; visible?: boolean; children?: unknown[]; parentItemId?: string | null },
  menuId: string,
  index: number,
  context: NavigationResolutionContext,
): EditorNavigationItem {
  const children = Array.isArray(item.children)
    ? item.children.flatMap((child, childIndex) => {
        if (!isRecord(child) || typeof child.label !== "string" || typeof child.href !== "string") {
          return [];
        }
        return [
          toNavigationItem(
            child as unknown as WebsiteNavigation["primary"][number] & {
              id?: string;
              visible?: boolean;
              children?: unknown[];
            },
            `${menuId}:child:${index + 1}`,
            childIndex,
            context,
          ),
        ];
      })
    : [];

  return {
    id: item.id || `${menuId}:item:${index + 1}:${sanitizeToken(item.href || item.label)}`,
    label: item.label,
    target: resolveNavigationTarget(item, context),
    visible: item.visible !== false,
    children,
    legacyHref: item.href,
  };
}

function toNavigationMenus(
  navigation: WebsiteNavigation,
  context: NavigationResolutionContext,
): EditorNavigationMenu[] {
  const menus: EditorNavigationMenu[] = [
    {
      id: "primary",
      location: "header",
      items: (navigation.primary ?? []).map((item, index) => toNavigationItem(item, "primary", index, context)),
    },
  ];

  if (navigation.footer?.length) {
    menus.push({
      id: "footer",
      location: "footer",
      items: navigation.footer.map((item, index) => toNavigationItem(item, "footer", index, context)),
    });
  }

  (navigation.menus ?? []).forEach((menu, menuIndex) => {
    const id = menus.some((candidate) => candidate.id === menu.id)
      ? `legacy-menu:${menu.id}`
      : menu.id || `legacy-menu:${menuIndex + 1}`;
    menus.push({
      id,
      location: menu.location,
      ...(menu.style ? { label: menu.style } : {}),
      items: menu.items.map((item, index) => toNavigationItem(item, id, index, context)),
    });
  });

  return menus;
}

/**
 * Deterministically maps an existing generated website to the future document
 * contract. It performs no normalization and never mutates the input.
 */
export function adaptWebsiteStructureToEditorDocument(structure: WebsiteStructure): EditorDocument {
  const usedNodeIds = new Set<string>();
  const nodes: Record<EditorNodeId, EditorNode> = {};
  const assets: Record<EditorAssetId, EditorAssetReference> = {};
  const sectionByAnchor = new Map<string, SectionReference>();
  const orderedPages = ordered(structure.pages);

  const pages: EditorPage[] = orderedPages.map((page) => {
    const rootNodeId = deterministicNodeId(
      `legacy:${structure.id}:page:${page.id}:root`,
      usedNodeIds,
      `legacy:${structure.id}:page:${sanitizeToken(page.id)}:root`,
    );
    const sectionIds: EditorNodeId[] = [];
    const layoutPage = structure.layout?.pages.find((candidate) => candidate.pageId === page.id);

    ordered(page.sections).forEach((section) => {
      const sectionNode = toSectionNode(
        section,
        page.id,
        structure.id,
        usedNodeIds,
        assets,
        layoutPage?.sectionLayouts.find((layout) => layout.sectionId === section.id),
      );
      nodes[sectionNode.id] = sectionNode;
      createComponentNodesFromSectionNode(sectionNode).forEach((componentNode) => {
        nodes[componentNode.id] = componentNode;
      });
      sectionIds.push(sectionNode.id);

      const reference = { nodeId: sectionNode.id, pageId: page.id };
      sectionByAnchor.set(section.id, reference);
      if (!sectionByAnchor.has(String(section.type))) {
        sectionByAnchor.set(String(section.type), reference);
      }
    });

    nodes[rootNodeId] = {
      id: rootNodeId,
      type: "layout.page-root",
      kind: "container",
      props: {},
      visibility: toVisibility(page.visible),
      slots: {
        default: {
          name: "default",
          childIds: sectionIds,
        },
      },
      legacy: {
        source: "website-structure",
        sourceId: page.id,
        sourceType: page.type,
      },
    };

    return {
      id: page.id,
      name: page.title,
      path: page.slug,
      order: page.order,
      visibility: toVisibility(page.visible),
      seo: toPageSeo(page),
      ...(layoutPage
        ? {
            styles: {
              template: layoutPage.templateName,
              themeMode: layoutPage.metadata.themeMode,
              spacing: layoutPage.metadata.spacingScale,
            },
          }
        : {}),
      navigation: toPageNavigationIntent(page),
      rootNodeIds: [rootNodeId],
      legacyPageType: page.type,
      ...(layoutPage ? { legacyLayout: toEditorValue(layoutPage) as EditorValueObject } : {}),
    };
  });

  const headerNodeId = deterministicNodeId(
    `legacy:${structure.id}:global:header`,
    usedNodeIds,
    `legacy:${structure.id}:global:header`,
  );
  const footerNodeId = deterministicNodeId(
    `legacy:${structure.id}:global:footer`,
    usedNodeIds,
    `legacy:${structure.id}:global:footer`,
  );
  nodes[headerNodeId] = {
    id: headerNodeId,
    type: "site.header",
    kind: "global",
    props: {
      siteName: structure.siteTitle,
      ...(structure.tagline ? { tagline: structure.tagline } : {}),
    },
    visibility: { base: true },
    slots: {},
    legacy: {
      source: "website-structure",
      sourceId: "header",
      sourceType: "header",
    },
  };
  nodes[footerNodeId] = {
    id: footerNodeId,
    type: "site.footer",
    kind: "global",
    props: {},
    visibility: { base: true },
    slots: {},
    legacy: {
      source: "website-structure",
      sourceId: "footer",
      sourceType: "footer",
    },
  };

  const pageIdByPath = new Map(pages.map((page) => [page.path, page.id]));
  const activePageId = structure.navigation.activePath
    ? pageIdByPath.get(structure.navigation.activePath)
    : undefined;

  return {
    id: `editor-document:${structure.id}`,
    schemaVersion: EDITOR_DOCUMENT_SCHEMA_VERSION,
    site: {
      name: structure.siteTitle,
      ...(structure.tagline ? { tagline: structure.tagline } : {}),
      seo: toSiteSeo(structure),
      styles: toSiteStyles(structure),
    },
    pages,
    nodes,
    assets,
    navigation: {
      menus: toNavigationMenus(structure.navigation, {
        pageIds: new Set(pages.map((page) => page.id)),
        pageIdByPath,
        sectionByAnchor,
      }),
      ...(activePageId ? { activePageId } : {}),
      ...(structure.navigation.hierarchy
        ? { legacyHierarchy: toEditorValue(structure.navigation.hierarchy) as EditorValueObject }
        : {}),
    },
    globals: {
      header: { id: "header", role: "header", nodeId: headerNodeId },
      footer: { id: "footer", role: "footer", nodeId: footerNodeId },
      symbols: {},
    },
    compatibility: {
      source: "website-structure",
      structureId: structure.id,
      structureVersion: structure.version,
    },
  };
}

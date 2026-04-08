import { createDefaultPageSeeds } from "./defaults";
import { orderPages } from "./ordering";
import { buildUniquePaths } from "./paths";
import type {
  NavigationGenerationContext,
  NavigationPageSeed,
  PageHierarchyModel,
  PageHierarchyNode,
} from "./types";

function mergePageSeeds(context: NavigationGenerationContext): NavigationPageSeed[] {
  const defaults = createDefaultPageSeeds(context.websiteType);
  const bySlug = new Map<string, NavigationPageSeed>();

  defaults.forEach((page) => {
    bySlug.set(page.slug, page);
  });

  context.pages.forEach((page, index) => {
    const existing = bySlug.get(page.slug);
    bySlug.set(page.slug, {
      ...existing,
      ...page,
      order: page.order ?? existing?.order ?? index,
      visible: page.visible ?? true,
      parentPageId: page.parentPageId ?? existing?.parentPageId ?? null,
      includeInNavigation: page.includeInNavigation ?? existing?.includeInNavigation ?? true,
      priority: page.priority ?? existing?.priority,
      navigationLabel: page.navigationLabel ?? existing?.navigationLabel,
    });
  });

  return Array.from(bySlug.values());
}

function resolveDepth(
  page: NavigationPageSeed,
  pagesById: Map<string, NavigationPageSeed>,
  seen = new Set<string>(),
): number {
  if (!page.parentPageId) return 0;
  if (seen.has(page.id)) return 0;
  const parent = pagesById.get(page.parentPageId);
  if (!parent) return 0;
  seen.add(page.id);
  return 1 + resolveDepth(parent, pagesById, seen);
}

export function generatePageHierarchy(
  context: NavigationGenerationContext,
): PageHierarchyModel {
  const merged = mergePageSeeds(context);
  const ordered = orderPages(merged);
  const pagesById = new Map(ordered.map((page) => [page.id, page]));
  const pathByPageId = buildUniquePaths(ordered);

  const nodes: PageHierarchyNode[] = ordered.map((page, index) => {
    const depth = resolveDepth(page, pagesById);
    const path = pathByPageId.get(page.id) ?? page.slug;

    return {
      pageId: page.id,
      slug: page.slug,
      path,
      parentPageId: page.parentPageId ?? null,
      depth,
      order: index,
      priority: page.priority ?? index,
      pageType: page.type,
      visible: page.visible,
      navigation: {
        includeInHeader: page.includeInNavigation ?? true,
        includeInFooter: true,
        includeInSidebar: depth > 0,
      },
      purpose: page.type,
    };
  });

  return {
    rootPageIds: nodes.filter((node) => !node.parentPageId).map((node) => node.pageId),
    nodes,
    maxDepth: nodes.reduce((max, node) => Math.max(max, node.depth), 0),
  };
}

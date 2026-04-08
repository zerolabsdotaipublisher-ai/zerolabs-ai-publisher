import type { NavigationOverrideInput, NavigationPageSeed } from "./types";

export function applyNavigationOverrides(
  pages: NavigationPageSeed[],
  overrides?: NavigationOverrideInput,
): NavigationPageSeed[] {
  if (!overrides) return pages;

  let next = [...pages];

  if (overrides.removedPageIds?.length) {
    const removed = new Set(overrides.removedPageIds);
    next = next.filter((page) => !removed.has(page.id));
  }

  if (overrides.addedPages?.length) {
    const startOrder = next.length;
    overrides.addedPages.forEach((page, index) => {
      next.push({
        id: page.id,
        title: page.title,
        slug: page.slug,
        type: page.type,
        order: startOrder + index,
        visible: page.visible ?? true,
        parentPageId: page.parentPageId ?? null,
        priority: page.priority,
        includeInNavigation: page.includeInNavigation ?? true,
      });
    });
  }

  const byId = new Map(next.map((page) => [page.id, page]));

  if (overrides.labels) {
    Object.entries(overrides.labels).forEach(([pageId, label]) => {
      const page = byId.get(pageId);
      if (page) {
        page.navigationLabel = label;
      }
    });
  }

  if (overrides.visibility) {
    Object.entries(overrides.visibility).forEach(([pageId, visible]) => {
      const page = byId.get(pageId);
      if (page) {
        page.visible = visible;
      }
    });
  }

  if (overrides.parentPageIds) {
    Object.entries(overrides.parentPageIds).forEach(([pageId, parentPageId]) => {
      const page = byId.get(pageId);
      if (page) {
        page.parentPageId = parentPageId;
      }
    });
  }

  if (overrides.order?.length) {
    const indexByPageId = new Map(overrides.order.map((id, index) => [id, index]));
    next = next
      .map((page) => ({
        ...page,
        order: indexByPageId.get(page.id) ?? page.order,
      }))
      .sort((a, b) => a.order - b.order);
  }

  return next;
}

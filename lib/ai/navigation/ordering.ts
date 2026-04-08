import type { NavigationPageSeed } from "./types";

const PAGE_TYPE_PRIORITY: Record<NavigationPageSeed["type"], number> = {
  home: 0,
  services: 20,
  about: 30,
  contact: 100,
  custom: 50,
};

function normalizedOrder(page: NavigationPageSeed): number {
  if (typeof page.priority === "number") {
    return page.priority;
  }
  return PAGE_TYPE_PRIORITY[page.type] + page.order;
}

export function orderPages(pages: NavigationPageSeed[]): NavigationPageSeed[] {
  return [...pages].sort((a, b) => {
    const priorityDiff = normalizedOrder(a) - normalizedOrder(b);
    if (priorityDiff !== 0) return priorityDiff;
    if (a.slug === "/") return -1;
    if (b.slug === "/") return 1;
    if (a.type === "contact" && b.type !== "contact") return 1;
    if (b.type === "contact" && a.type !== "contact") return -1;
    return a.order - b.order;
  });
}

import type { NavigationPageSeed } from "./types";

function slugify(value: string): string {
  const cleaned = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "page";
}

function normalizeBasePath(value: string): string {
  if (!value || value === "/") return "/";
  const normalized = `/${slugify(value.replace(/^\/+/, ""))}`;
  return normalized.replace(/\/$/, "") || "/";
}

export function buildUniquePaths(pages: NavigationPageSeed[]): Map<string, string> {
  const pagesById = new Map(pages.map((page) => [page.id, page]));
  const usedPaths = new Set<string>();
  const pathByPageId = new Map<string, string>();

  const resolvePath = (
    page: NavigationPageSeed,
    stack = new Set<string>(),
  ): string => {
    if (pathByPageId.has(page.id)) {
      return pathByPageId.get(page.id)!;
    }
    if (stack.has(page.id)) {
      return normalizeBasePath(page.slug);
    }
    stack.add(page.id);

    const base = normalizeBasePath(page.slug);
    const parent = page.parentPageId ? pagesById.get(page.parentPageId) : undefined;
    const parentPath = parent ? resolvePath(parent, stack) : undefined;

    let candidate =
      parentPath && base !== "/"
        ? `${parentPath === "/" ? "" : parentPath}${base}`
        : base;

    if (candidate !== "/") {
      candidate = candidate.replace(/\/+/g, "/");
      candidate = candidate.endsWith("/") ? candidate.slice(0, -1) : candidate;
    }

    if (!candidate.startsWith("/")) {
      candidate = `/${candidate}`;
    }

    let deduped = candidate;
    let index = 1;
    while (usedPaths.has(deduped)) {
      deduped = `${candidate}-${index++}`;
    }

    usedPaths.add(deduped);
    pathByPageId.set(page.id, deduped);
    stack.delete(page.id);
    return deduped;
  };

  pages.forEach((page) => {
    resolvePath(page);
  });

  return pathByPageId;
}

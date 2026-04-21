const ROUTE_SLUG_PATTERN = /^\/(?:[a-z0-9]+(?:-[a-z0-9]+)*)?(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

export function slugifySegment(value: string): string {
  const cleaned = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return cleaned || "page";
}

export function normalizeRoutePath(value: string): string {
  if (!value || value === "/" || value === "home") {
    return "/";
  }

  const normalized = value
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map(slugifySegment)
    .join("/");

  return normalized ? `/${normalized}` : "/";
}

export function createDeterministicPagePath(params: {
  slug?: string;
  title: string;
  type: string;
  isHome: boolean;
  parentPath?: string;
}): string {
  if (params.isHome) {
    return "/";
  }

  const candidate = normalizeRoutePath(params.slug || params.title || params.type);
  if (!params.parentPath || params.parentPath === "/") {
    return candidate;
  }

  return normalizeRoutePath(`${params.parentPath}/${candidate}`);
}

export function isValidRoutePath(value: string): boolean {
  return ROUTE_SLUG_PATTERN.test(value);
}

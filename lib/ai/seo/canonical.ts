function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function normalizeSlug(pageSlug: string): string {
  const trimmed = pageSlug.trim();
  if (!trimmed || trimmed === "home") return "/";
  if (trimmed === "/") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function normalizeCanonicalBaseUrl(baseUrl: string): string {
  return trimTrailingSlash(baseUrl.trim());
}

export function buildCanonicalUrl(
  baseUrl: string,
  structurePath: string,
  pageSlug: string,
): string {
  const root = normalizeCanonicalBaseUrl(baseUrl);
  const normalizedStructurePath = structurePath.startsWith("/")
    ? structurePath
    : `/${structurePath}`;
  const normalizedPageSlug = normalizeSlug(pageSlug);

  if (normalizedPageSlug === "/") {
    return `${root}${normalizedStructurePath}`;
  }

  return `${root}${normalizedStructurePath}?page=${encodeURIComponent(normalizedPageSlug)}`;
}

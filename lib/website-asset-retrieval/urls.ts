import type { WebsiteStructure } from "@/lib/ai/structure";

interface WebsiteAssetUrlContext {
  previewToken?: string;
}

function toMutableClone<T>(value: T): T {
  return structuredClone(value);
}

export function buildWebsiteAssetRenderPath(assetId: string): string {
  return `/api/website-assets/${encodeURIComponent(assetId)}`;
}

export function buildWebsiteAssetUrlPath(assetId: string): string {
  return `${buildWebsiteAssetRenderPath(assetId)}/url`;
}

export function toWebsiteAssetRenderableUrl(value: string): string {
  if (!isWebsiteAssetPath(value)) {
    return value;
  }

  const isAbsolute = value.startsWith("http://") || value.startsWith("https://");
  const url = isAbsolute ? new URL(value) : new URL(value, "http://localhost");

  if (/^\/api\/website-assets\/[^/]+\/url$/i.test(url.pathname)) {
    return isAbsolute ? url.toString() : `${url.pathname}${url.search}`;
  }

  if (/^\/api\/website-assets\/[^/]+$/i.test(url.pathname)) {
    url.pathname = `${url.pathname}/url`;
  }

  return isAbsolute ? url.toString() : `${url.pathname}${url.search}`;
}

export function isWebsiteAssetPath(value: string): boolean {
  return value.startsWith("/api/website-assets/") || /^https?:\/\/[^/]+\/api\/website-assets\//.test(value);
}

export function appendWebsiteAssetQueryContext(value: string, context: WebsiteAssetUrlContext): string {
  if (!isWebsiteAssetPath(value)) {
    return value;
  }

  const renderableValue = toWebsiteAssetRenderableUrl(value);
  const url = renderableValue.startsWith("http://") || renderableValue.startsWith("https://")
    ? new URL(renderableValue)
    : new URL(renderableValue, "http://localhost");

  if (context.previewToken) {
    url.searchParams.set("previewToken", context.previewToken);
  } else {
    url.searchParams.delete("previewToken");
  }

  return renderableValue.startsWith("http://") || renderableValue.startsWith("https://")
    ? url.toString()
    : `${url.pathname}${url.search}`;
}

function containsWebsiteAssetPath(value: unknown): boolean {
  if (typeof value === "string") {
    return isWebsiteAssetPath(value);
  }

  if (Array.isArray(value)) {
    return value.some((entry) => containsWebsiteAssetPath(entry));
  }

  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).some((entry) => containsWebsiteAssetPath(entry));
  }

  return false;
}

function rewriteValue(value: unknown, context: WebsiteAssetUrlContext): unknown {
  if (typeof value === "string") {
    return appendWebsiteAssetQueryContext(value, context);
  }

  if (Array.isArray(value)) {
    return value.map((entry) => rewriteValue(entry, context));
  }

  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((accumulator, [key, entry]) => {
      accumulator[key] = rewriteValue(entry, context);
      return accumulator;
    }, {});
  }

  return value;
}

export function withWebsiteAssetQueryContext(structure: WebsiteStructure, context: WebsiteAssetUrlContext): WebsiteStructure {
  if (!context.previewToken || !containsWebsiteAssetPath(structure)) {
    return structure;
  }

  const clone = toMutableClone(structure);
  clone.pages = clone.pages.map((page) => ({
    ...page,
    seo: rewriteValue(page.seo, context) as typeof page.seo,
    sections: page.sections.map((section) => ({
      ...section,
      content: rewriteValue(section.content, context) as typeof section.content,
      components: section.components?.map((component) => ({
        ...component,
        props: rewriteValue(component.props, context) as typeof component.props,
      })),
    })),
  }));
  clone.seo = rewriteValue(clone.seo, context) as typeof clone.seo;
  return clone;
}

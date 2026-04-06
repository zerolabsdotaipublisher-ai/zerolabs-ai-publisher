import type { WebsiteStructure } from "../structure/types";
import type { LayoutGenerationOptions, WebsiteLayoutModel } from "./types";

const layoutCache = new Map<string, WebsiteLayoutModel>();

function createCacheKey(
  structure: WebsiteStructure,
  options?: LayoutGenerationOptions,
): string {
  const overridesKey = JSON.stringify(options?.overrides ?? {});
  return `${structure.id}:${structure.updatedAt}:${overridesKey}`;
}

export function getCachedLayout(
  structure: WebsiteStructure,
  options?: LayoutGenerationOptions,
): WebsiteLayoutModel | null {
  const key = createCacheKey(structure, options);
  return layoutCache.get(key) ?? null;
}

export function setCachedLayout(
  structure: WebsiteStructure,
  options: LayoutGenerationOptions | undefined,
  layout: WebsiteLayoutModel,
): void {
  const key = createCacheKey(structure, options);
  layoutCache.set(key, layout);

  while (layoutCache.size > 50) {
    const firstKey = layoutCache.keys().next().value;
    if (!firstKey) break;
    layoutCache.delete(firstKey);
  }
}

import { mapStructureToLayout } from "./mapper";
import { applyLayoutVisibilityOverrides, sanitizeLayoutOverrides } from "./overrides";
import { getCachedLayout, setCachedLayout } from "./performance";
import { ensureValidWebsiteLayout } from "./validation";
import type { WebsiteStructure } from "../structure/types";
import type {
  LayoutGenerationOptions,
  LayoutGenerationResult,
  LayoutOverrides,
  PageLayoutModel,
} from "./types";

function defaultNow(value?: string): string {
  return value ?? new Date().toISOString();
}

export function generatePageLayoutForPage(
  structure: WebsiteStructure,
  pageSlug: string,
  overrides?: LayoutOverrides,
): PageLayoutModel | null {
  const sanitized = sanitizeLayoutOverrides(overrides);
  const result = generatePageLayouts(structure, { overrides: sanitized });
  return result.layout.pages.find((page) => page.pageSlug === pageSlug) ?? null;
}

export function generatePageLayouts(
  structure: WebsiteStructure,
  options?: LayoutGenerationOptions,
): LayoutGenerationResult {
  const cached = getCachedLayout(structure, options);
  if (cached) {
    return { layout: cached, validationErrors: [], usedFallback: false };
  }

  const overrides = sanitizeLayoutOverrides(options?.overrides);

  let layout = mapStructureToLayout(
    structure,
    {
      websiteType: structure.websiteType,
      styleTone: structure.styleConfig.tone,
      stylePreset: structure.styleConfig.style,
    },
    overrides,
  );

  if (overrides) {
    layout = applyLayoutVisibilityOverrides(layout, overrides);
  }

  layout = {
    ...layout,
    generatedAt: defaultNow(options?.now),
  };

  const validated = ensureValidWebsiteLayout(layout);
  setCachedLayout(structure, options, validated.layout);

  return {
    layout: validated.layout,
    validationErrors: validated.errors,
    usedFallback: validated.usedFallback,
  };
}

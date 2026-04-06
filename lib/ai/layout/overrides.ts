import { SUPPORTED_LAYOUT_VARIANTS } from "./schemas";
import type {
  AlignmentMode,
  LayoutOverrides,
  LayoutVariantName,
  SpacingScale,
  WebsiteLayoutModel,
} from "./types";

function normalizeSpacingScale(value: unknown): SpacingScale | undefined {
  if (value === "compact" || value === "comfortable" || value === "spacious") {
    return value;
  }
  return undefined;
}

function normalizeAlignment(value: unknown): AlignmentMode | undefined {
  if (value === "left" || value === "center" || value === "balanced") {
    return value;
  }
  return undefined;
}

function normalizeTemplate(value: unknown): LayoutVariantName | undefined {
  if (typeof value !== "string") return undefined;
  return SUPPORTED_LAYOUT_VARIANTS.includes(value as LayoutVariantName)
    ? (value as LayoutVariantName)
    : undefined;
}

function filterValidEntries<T extends string>(
  input: Record<string, unknown>,
  validator: (value: unknown) => T | undefined,
): Record<string, T> {
  return Object.fromEntries(
    Object.entries(input).flatMap(([key, value]) => {
      const normalized = validator(value);
      return normalized ? [[key, normalized]] : [];
    }),
  );
}

function sanitizeSectionOrderMap(
  input: Record<string, unknown>,
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(input).map(([slug, value]) => {
      const ids = Array.isArray(value)
        ? value.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
        : [];
      return [slug, ids];
    }),
  );
}

function sanitizeVisibilityMap(
  input: Record<string, unknown>,
): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(input).flatMap(([sectionId, value]) =>
      typeof value === "boolean" ? [[sectionId, value]] : [],
    ),
  );
}

export function sanitizeLayoutOverrides(overrides?: LayoutOverrides): LayoutOverrides | undefined {
  if (!overrides) return undefined;

  return {
    pageTemplateBySlug: filterValidEntries(
      overrides.pageTemplateBySlug ?? {},
      normalizeTemplate,
    ),
    sectionOrderByPageSlug: sanitizeSectionOrderMap(
      (overrides.sectionOrderByPageSlug ?? {}) as Record<string, unknown>,
    ),
    sectionVisibilityById: sanitizeVisibilityMap(
      (overrides.sectionVisibilityById ?? {}) as Record<string, unknown>,
    ),
    spacingScaleByPageSlug: filterValidEntries(
      overrides.spacingScaleByPageSlug ?? {},
      normalizeSpacingScale,
    ),
    alignmentBySectionId: filterValidEntries(
      overrides.alignmentBySectionId ?? {},
      normalizeAlignment,
    ),
  };
}

export function applyLayoutVisibilityOverrides(
  model: WebsiteLayoutModel,
  overrides?: LayoutOverrides,
): WebsiteLayoutModel {
  if (!overrides?.sectionVisibilityById) return model;

  const visibility = overrides.sectionVisibilityById;

  return {
    ...model,
    pages: model.pages.map((page) => ({
      ...page,
      sectionLayouts: page.sectionLayouts.map((node) => ({
        ...node,
        visible: visibility[node.sectionId] ?? node.visible,
      })),
      hierarchy: page.hierarchy.map((entry) => {
        if ("children" in entry) {
          return {
            ...entry,
            children: entry.children.map((node) => ({
              ...node,
              visible: visibility[node.sectionId] ?? node.visible,
            })),
          };
        }

        return {
          ...entry,
          visible: visibility[entry.sectionId] ?? entry.visible,
        };
      }),
    })),
  };
}

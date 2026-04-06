import type { AlignmentMode, LayoutOverrides, SpacingScale, WebsiteLayoutModel } from "./types";

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

export function sanitizeLayoutOverrides(overrides?: LayoutOverrides): LayoutOverrides | undefined {
  if (!overrides) return undefined;

  const spacingScaleByPageSlug = filterValidEntries(
    overrides.spacingScaleByPageSlug ?? {},
    normalizeSpacingScale,
  );

  const alignmentBySectionId = filterValidEntries(
    overrides.alignmentBySectionId ?? {},
    normalizeAlignment,
  );

  return {
    ...overrides,
    spacingScaleByPageSlug,
    alignmentBySectionId,
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

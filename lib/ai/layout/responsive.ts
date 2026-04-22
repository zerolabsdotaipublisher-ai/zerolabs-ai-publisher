import type { SectionType } from "../structure/types";
import type { Breakpoint, ResponsiveHint, SpacingScale } from "./types";

function desktopForSection(sectionType: SectionType, spacing: SpacingScale): ResponsiveHint {
  if (
    sectionType === "services" ||
    sectionType === "features" ||
    sectionType === "benefits" ||
    sectionType === "pricing" ||
    sectionType === "testimonials"
  ) {
    return {
      columns: "three",
      stackBehavior: "preserve",
      spacingScale: spacing,
      alignmentMode: "balanced",
      heroLayoutMode: "split",
    };
  }

  if (sectionType === "hero") {
    return {
      columns: "two",
      stackBehavior: "preserve",
      spacingScale: spacing,
      alignmentMode: "balanced",
      heroLayoutMode: "split",
    };
  }

  return {
    columns: "single",
    stackBehavior: "preserve",
    spacingScale: spacing,
    alignmentMode: "left",
    heroLayoutMode: "centered",
  };
}

function tabletForSection(sectionType: SectionType, spacing: SpacingScale): ResponsiveHint {
  return {
    columns:
      sectionType === "services" ||
      sectionType === "features" ||
      sectionType === "benefits" ||
      sectionType === "pricing" ||
      sectionType === "testimonials"
        ? "two"
        : "single",
    stackBehavior: "stack",
    spacingScale: spacing,
    alignmentMode: "balanced",
    heroLayoutMode: sectionType === "hero" ? "stacked" : "centered",
  };
}

function mobileForSection(spacing: SpacingScale): ResponsiveHint {
  return {
    columns: "single",
    stackBehavior: "priority-stack",
    spacingScale: spacing,
    alignmentMode: "left",
    heroLayoutMode: "stacked",
  };
}

export function getResponsiveHintsForSection(
  sectionType: SectionType,
  spacingScale: SpacingScale,
): Record<Breakpoint, ResponsiveHint> {
  return {
    desktop: desktopForSection(sectionType, spacingScale),
    tablet: tabletForSection(sectionType, spacingScale),
    mobile: mobileForSection(spacingScale),
  };
}

export const DEFAULT_RESPONSIVE_HINTS: Record<Breakpoint, ResponsiveHint> = {
  desktop: {
    columns: "single",
    stackBehavior: "preserve",
    spacingScale: "comfortable",
    alignmentMode: "balanced",
    heroLayoutMode: "split",
  },
  tablet: {
    columns: "single",
    stackBehavior: "stack",
    spacingScale: "comfortable",
    alignmentMode: "balanced",
    heroLayoutMode: "stacked",
  },
  mobile: {
    columns: "single",
    stackBehavior: "priority-stack",
    spacingScale: "comfortable",
    alignmentMode: "left",
    heroLayoutMode: "stacked",
  },
};

import type { SectionType } from "../structure/types";
import type {
  AlignmentMode,
  SectionAlignmentRule,
  WidthConstraint,
} from "./types";

function defaultsBySection(
  sectionType: SectionType,
): Pick<SectionAlignmentRule, "alignment" | "widthConstraint" | "containerVariant"> {
  switch (sectionType) {
    case "hero":
      return {
        alignment: "balanced",
        widthConstraint: "wide",
        containerVariant: "emphasis",
      };
    case "services":
    case "testimonials":
      return {
        alignment: "left",
        widthConstraint: "wide",
        containerVariant: "card",
      };
    case "footer":
      return {
        alignment: "center",
        widthConstraint: "full",
        containerVariant: "plain",
      };
    default:
      return {
        alignment: "left",
        widthConstraint: "content",
        containerVariant: "default",
      };
  }
}

function normalizeWidth(
  alignment: AlignmentMode,
  fallback: WidthConstraint,
): WidthConstraint {
  if (alignment === "center" && fallback === "narrow") {
    return "content";
  }
  return fallback;
}

export function getSectionAlignmentRule(
  sectionType: SectionType,
  alignmentOverride?: AlignmentMode,
): SectionAlignmentRule {
  const defaults = defaultsBySection(sectionType);
  const alignment = alignmentOverride ?? defaults.alignment;

  return {
    sectionType,
    alignment,
    widthConstraint: normalizeWidth(alignment, defaults.widthConstraint),
    containerVariant: defaults.containerVariant,
  };
}

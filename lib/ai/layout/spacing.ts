import type { SectionType } from "../structure/types";
import type { SectionSpacingRule, SpacingScale } from "./types";

const SCALE_MAP: Record<SpacingScale, SectionSpacingRule["paddingBlock"]> = {
  compact: "sm",
  comfortable: "md",
  spacious: "lg",
};

function marginFor(type: SectionType): Pick<SectionSpacingRule, "marginTop" | "marginBottom"> {
  switch (type) {
    case "hero":
      return { marginTop: "none", marginBottom: "sm" };
    case "footer":
      return { marginTop: "md", marginBottom: "none" };
    case "cta":
      return { marginTop: "sm", marginBottom: "sm" };
    default:
      return { marginTop: "xs", marginBottom: "xs" };
  }
}

export function getSectionSpacingRule(
  sectionType: SectionType,
  spacingScale: SpacingScale,
): SectionSpacingRule {
  const margin = marginFor(sectionType);
  return {
    sectionType,
    paddingBlock: SCALE_MAP[spacingScale],
    marginTop: margin.marginTop,
    marginBottom: margin.marginBottom,
  };
}

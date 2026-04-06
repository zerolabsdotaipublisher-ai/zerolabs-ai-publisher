import { edgeCaseStructureFixture } from "../../structure/fixtures";
import { generatePageLayouts } from "../engine";
import type { WebsiteLayoutModel } from "../types";

export const edgeCaseLayoutFixture: WebsiteLayoutModel = generatePageLayouts(
  edgeCaseStructureFixture,
  {
    overrides: {
      pageTemplateBySlug: { "/": "minimal" },
      sectionVisibilityById: {
        sec_testimonials_edge_001: false,
      },
    },
  },
).layout;

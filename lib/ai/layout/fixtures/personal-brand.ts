import { personalBrandStructureFixture } from "../../structure/fixtures";
import { generatePageLayouts } from "../engine";
import type { WebsiteLayoutModel } from "../types";

export const personalBrandLayoutFixture: WebsiteLayoutModel = generatePageLayouts(
  personalBrandStructureFixture,
).layout;

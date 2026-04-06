import { landingPageStructureFixture } from "../../structure/fixtures";
import { generatePageLayouts } from "../engine";
import type { WebsiteLayoutModel } from "../types";

export const landingPageLayoutFixture: WebsiteLayoutModel = generatePageLayouts(
  landingPageStructureFixture,
).layout;

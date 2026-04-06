import { portfolioStructureFixture } from "../../structure/fixtures";
import { generatePageLayouts } from "../engine";
import type { WebsiteLayoutModel } from "../types";

export const portfolioLayoutFixture: WebsiteLayoutModel = generatePageLayouts(
  portfolioStructureFixture,
).layout;

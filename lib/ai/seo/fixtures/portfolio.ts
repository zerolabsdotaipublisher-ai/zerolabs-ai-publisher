import { portfolioFixture } from "../../prompts/fixtures";
import { portfolioStructureFixture } from "../../structure/fixtures";
import { createFallbackWebsiteSeoPackage } from "../fallback";

export const portfolioSeoFixture = createFallbackWebsiteSeoPackage({
  structure: portfolioStructureFixture,
  input: portfolioFixture,
  userId: portfolioStructureFixture.userId,
  version: portfolioStructureFixture.version,
});

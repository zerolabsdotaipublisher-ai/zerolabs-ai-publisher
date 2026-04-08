import { personalBrandFixture } from "../../prompts/fixtures";
import { personalBrandStructureFixture } from "../../structure/fixtures";
import { createFallbackWebsiteSeoPackage } from "../fallback";

export const personalBrandSeoFixture = createFallbackWebsiteSeoPackage({
  structure: personalBrandStructureFixture,
  input: personalBrandFixture,
  userId: personalBrandStructureFixture.userId,
  version: personalBrandStructureFixture.version,
});

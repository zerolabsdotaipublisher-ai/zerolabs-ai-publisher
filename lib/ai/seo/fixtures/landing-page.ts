import { landingPageFixture } from "../../prompts/fixtures";
import { landingPageStructureFixture } from "../../structure/fixtures";
import { createFallbackWebsiteSeoPackage } from "../fallback";

export const landingPageSeoFixture = createFallbackWebsiteSeoPackage({
  structure: landingPageStructureFixture,
  input: landingPageFixture,
  userId: landingPageStructureFixture.userId,
  version: landingPageStructureFixture.version,
});

import { businessSiteFixture } from "../../prompts/fixtures";
import { businessSiteStructureFixture } from "../../structure/fixtures";
import { createFallbackWebsiteSeoPackage } from "../fallback";

export const businessSiteSeoFixture = createFallbackWebsiteSeoPackage({
  structure: businessSiteStructureFixture,
  input: businessSiteFixture,
  userId: businessSiteStructureFixture.userId,
  version: businessSiteStructureFixture.version,
});

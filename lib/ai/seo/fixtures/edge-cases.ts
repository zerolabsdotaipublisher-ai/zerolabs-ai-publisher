import { edgeCaseFixture } from "../../prompts/fixtures";
import { edgeCaseStructureFixture } from "../../structure/fixtures";
import { createFallbackWebsiteSeoPackage } from "../fallback";

export const edgeCaseSeoFixture = createFallbackWebsiteSeoPackage({
  structure: edgeCaseStructureFixture,
  input: edgeCaseFixture,
  userId: edgeCaseStructureFixture.userId,
  version: edgeCaseStructureFixture.version,
});

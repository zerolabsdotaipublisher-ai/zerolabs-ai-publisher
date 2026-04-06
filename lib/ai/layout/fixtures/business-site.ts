import { businessSiteStructureFixture } from "../../structure/fixtures";
import { generatePageLayouts } from "../engine";
import type { WebsiteLayoutModel } from "../types";

export const businessSiteLayoutFixture: WebsiteLayoutModel = generatePageLayouts(
  businessSiteStructureFixture,
).layout;

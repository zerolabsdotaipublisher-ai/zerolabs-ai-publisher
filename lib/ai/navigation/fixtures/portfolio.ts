import { generateWebsiteNavigation } from "../generator";
import { createDefaultPageSeeds } from "../defaults";

export const portfolioNavigationFixture = generateWebsiteNavigation({
  websiteType: "portfolio",
  siteTitle: "Avery Studio",
  pages: createDefaultPageSeeds("portfolio"),
});

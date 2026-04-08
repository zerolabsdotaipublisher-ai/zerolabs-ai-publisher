import { generateWebsiteNavigation } from "../generator";
import { createDefaultPageSeeds } from "../defaults";

export const businessSiteNavigationFixture = generateWebsiteNavigation({
  websiteType: "small-business",
  siteTitle: "North Shore Plumbing",
  pages: createDefaultPageSeeds("small-business"),
});

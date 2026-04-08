import { generateWebsiteNavigation } from "../generator";
import { createDefaultPageSeeds } from "../defaults";

export const personalBrandNavigationFixture = generateWebsiteNavigation({
  websiteType: "personal-brand",
  siteTitle: "Jordan Hale",
  pages: createDefaultPageSeeds("personal-brand"),
});

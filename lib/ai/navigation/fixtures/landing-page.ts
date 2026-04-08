import { generateWebsiteNavigation } from "../generator";
import { createDefaultPageSeeds } from "../defaults";

export const landingPageNavigationFixture = generateWebsiteNavigation({
  websiteType: "landing-page",
  siteTitle: "PilotFlow",
  pages: createDefaultPageSeeds("landing-page"),
});

import { businessSiteFixture } from "../../prompts/fixtures";
import { createFallbackWebsiteContentPackage } from "../fallback";

export const businessSiteContentFixture = createFallbackWebsiteContentPackage(
  "ws_business_fixture",
  "user_fixture",
  "small-business",
  businessSiteFixture,
  [
    {
      pageSlug: "/",
      pageType: "home",
      sections: ["hero", "about", "services", "testimonials", "cta", "contact", "footer", "microcopy"],
    },
    {
      pageSlug: "/services",
      pageType: "services",
      sections: ["hero", "services", "features", "process", "cta", "contact", "footer", "microcopy"],
    },
  ],
  "balanced",
  "medium",
);

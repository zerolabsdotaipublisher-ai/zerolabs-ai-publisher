import { landingPageFixture } from "../../prompts/fixtures";
import { createFallbackWebsiteContentPackage } from "../fallback";

export const landingPageContentFixture = createFallbackWebsiteContentPackage(
  "ws_landing_fixture",
  "user_fixture",
  "landing-page",
  landingPageFixture,
  [
    {
      pageSlug: "/",
      pageType: "home",
      sections: ["hero", "services", "benefits", "testimonials", "cta", "contact", "footer", "microcopy"],
    },
  ],
  "concise",
  "high",
);

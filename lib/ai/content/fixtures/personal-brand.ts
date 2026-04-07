import { personalBrandFixture } from "../../prompts/fixtures";
import { createFallbackWebsiteContentPackage } from "../fallback";

export const personalBrandContentFixture = createFallbackWebsiteContentPackage(
  "ws_personal_fixture",
  "user_fixture",
  "personal-brand",
  personalBrandFixture,
  [
    {
      pageSlug: "/",
      pageType: "home",
      sections: ["hero", "about", "services", "testimonials", "cta", "contact", "footer", "microcopy"],
    },
    {
      pageSlug: "/about",
      pageType: "about",
      sections: ["hero", "about", "benefits", "faq", "cta", "footer", "microcopy"],
    },
  ],
  "balanced",
  "medium",
);

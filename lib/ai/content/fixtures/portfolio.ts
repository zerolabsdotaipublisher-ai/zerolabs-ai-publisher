import { portfolioFixture } from "../../prompts/fixtures";
import { createFallbackWebsiteContentPackage } from "../fallback";

export const portfolioContentFixture = createFallbackWebsiteContentPackage(
  "ws_portfolio_fixture",
  "user_fixture",
  "portfolio",
  portfolioFixture,
  [
    {
      pageSlug: "/",
      pageType: "home",
      sections: ["hero", "about", "services", "testimonials", "cta", "contact", "footer", "microcopy"],
    },
  ],
  "balanced",
  "medium",
);

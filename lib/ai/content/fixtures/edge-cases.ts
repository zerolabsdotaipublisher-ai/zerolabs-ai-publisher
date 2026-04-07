import { edgeCaseFixture } from "../../prompts/fixtures";
import { createFallbackWebsiteContentPackage } from "../fallback";

export const edgeCaseContentFixture = createFallbackWebsiteContentPackage(
  "ws_edge_fixture",
  "user_fixture",
  "landing-page",
  edgeCaseFixture,
  [
    {
      pageSlug: "/",
      pageType: "home",
      sections: ["hero", "about", "services", "faq", "cta", "contact", "footer", "microcopy"],
    },
    {
      pageSlug: "/contact",
      pageType: "contact",
      sections: ["hero", "contact", "faq", "cta", "footer", "microcopy"],
    },
  ],
  "concise",
  "light",
);

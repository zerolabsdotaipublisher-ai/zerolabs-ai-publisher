import type { WebsiteGenerationInput } from "../types";

export const edgeCaseFixture: WebsiteGenerationInput = {
  websiteType: "landing-page",
  brandName: "  Lean Launch Lab  ",
  description: "  Startup validation services with lean experiments.  ",
  targetAudience: "  Solo founders pre-product-market fit  ",
  tone: "custom",
  style: "custom",
  customToneNotes: "Direct, pragmatic, no hype",
  customStyleNotes: "Simple blocks with low decorative language",
  primaryCta: "  Request strategy session  ",
  services: [" MVP scoping ", " Experiment design ", " "],
  constraints: ["no fake metrics", "  "],
};

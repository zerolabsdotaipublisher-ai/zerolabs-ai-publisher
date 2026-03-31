import type { WebsiteGenerationInput } from "../types";

export const landingPageFixture: WebsiteGenerationInput = {
  websiteType: "landing-page",
  brandName: "SprintBoard",
  description: "A lightweight planning app for remote product teams.",
  targetAudience: "Product managers at seed to Series B startups",
  tone: "bold",
  style: "modern",
  primaryCta: "Start free trial",
  services: ["Sprint planning", "Roadmap sync", "Priority scoring"],
  constraints: ["Avoid enterprise jargon", "Target 8th-grade readability"],
};

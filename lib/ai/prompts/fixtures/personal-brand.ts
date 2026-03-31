import type { WebsiteGenerationInput } from "../types";

export const personalBrandFixture: WebsiteGenerationInput = {
  websiteType: "personal-brand",
  brandName: "Jordan Vale",
  description: "Leadership coach for first-time engineering managers.",
  targetAudience: "New managers leading teams of 3-10 engineers",
  tone: "friendly",
  style: "minimalist",
  primaryCta: "Book a coaching intro",
  services: ["1:1 coaching", "Team communication workshops"],
  founderProfile: {
    name: "Jordan Vale",
    role: "Coach",
    bio: "Former VP Engineering with 12 years of leadership experience.",
  },
};

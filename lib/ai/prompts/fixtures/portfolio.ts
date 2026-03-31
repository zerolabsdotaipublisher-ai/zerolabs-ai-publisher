import type { WebsiteGenerationInput } from "../types";

export const portfolioFixture: WebsiteGenerationInput = {
  websiteType: "portfolio",
  brandName: "Maya Lens Studio",
  description: "Freelance photographer creating visual stories for brands.",
  targetAudience: "Early-stage lifestyle brands needing campaign photos",
  tone: "premium",
  style: "editorial",
  primaryCta: "Book a discovery call",
  services: ["Brand photography", "Campaign direction", "Photo retouching"],
  founderProfile: {
    name: "Maya Chen",
    role: "Founder & Photographer",
    bio: "10+ years shooting campaigns across fashion and hospitality.",
  },
  contactInfo: {
    email: "maya@lens.example",
    socialLinks: ["https://instagram.com/maya"],
  },
};

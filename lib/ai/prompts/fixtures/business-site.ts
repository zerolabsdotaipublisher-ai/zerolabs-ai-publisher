import type { WebsiteGenerationInput } from "../types";

export const businessSiteFixture: WebsiteGenerationInput = {
  websiteType: "small-business",
  brandName: "Northline HVAC",
  description: "Local HVAC company focused on fast residential repairs.",
  targetAudience: "Homeowners within a 30-mile service area",
  tone: "professional",
  style: "corporate",
  primaryCta: "Schedule service",
  services: ["AC repair", "Heater installation", "Maintenance plans"],
  testimonials: [
    {
      quote: "Technician arrived within two hours and solved the issue fast.",
      author: "L. Rivera",
      role: "Homeowner",
    },
  ],
  contactInfo: {
    phone: "+1-555-0140",
    location: "Austin, TX",
  },
};

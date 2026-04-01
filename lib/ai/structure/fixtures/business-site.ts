import type { WebsiteStructure } from "../types";
import { businessSiteFixture } from "../../prompts/fixtures";

/**
 * A complete small-business website structure fixture.
 * Represents the expected output of the generation pipeline for a
 * professional, trust-focused local HVAC service business.
 */
export const businessSiteStructureFixture: WebsiteStructure = {
  id: "ws_business_fixture_001",
  userId: "user_fixture_001",
  websiteType: "small-business",
  siteTitle: "Northline HVAC",
  tagline: "Fast, reliable HVAC service for Austin homeowners.",
  pages: [
    {
      id: "page_home_business_001",
      slug: "/",
      title: "Home",
      type: "home",
      order: 0,
      seo: {
        title: "Northline HVAC | Austin HVAC Repair & Installation",
        description:
          "Fast residential HVAC repair and installation in Austin, TX. Schedule service today.",
        keywords: ["AC repair", "HVAC Austin", "heater installation", "maintenance plans"],
      },
      sections: [
        {
          id: "sec_hero_business_001",
          type: "hero",
          order: 0,
          visible: true,
          content: {
            headline: "Fast HVAC service when you need it most.",
            subheadline:
              "Northline HVAC serves Austin homeowners with same-day repairs and professional installs.",
            primaryCta: "Schedule service",
          },
        },
        {
          id: "sec_services_business_001",
          type: "services",
          order: 1,
          visible: true,
          content: {
            headline: "What we fix and install",
            items: [
              {
                name: "AC Repair",
                description:
                  "Diagnose and repair any air conditioning problem, fast.",
              },
              {
                name: "Heater Installation",
                description:
                  "Professional installation with a clean finish and full walkthrough.",
              },
              {
                name: "Maintenance Plans",
                description:
                  "Annual service plans that keep your system running year-round.",
              },
            ],
          },
        },
        {
          id: "sec_about_business_001",
          type: "about",
          order: 2,
          visible: true,
          content: {
            headline: "Local, licensed, and on time",
            body: "Northline HVAC has served the Austin area for over a decade. We focus on residential repairs, honest pricing, and showing up when we say we will.",
          },
        },
        {
          id: "sec_testimonials_business_001",
          type: "testimonials",
          order: 3,
          visible: true,
          content: {
            headline: "What our customers say",
            items: [
              {
                quote:
                  "Technician arrived within two hours and solved the issue fast.",
                author: "L. Rivera",
                role: "Homeowner",
              },
            ],
          },
        },
        {
          id: "sec_cta_business_001",
          type: "cta",
          order: 4,
          visible: true,
          content: {
            headline: "Ready to schedule?",
            ctaText: "Schedule service",
          },
        },
        {
          id: "sec_contact_business_001",
          type: "contact",
          order: 5,
          visible: true,
          content: {
            headline: "Call or visit us",
            channels: [
              { label: "Phone", value: "+1-555-0140" },
              { label: "Location", value: "Austin, TX" },
            ],
          },
        },
        {
          id: "sec_footer_business_001",
          type: "footer",
          order: 6,
          visible: true,
          content: {
            shortBlurb: "Northline HVAC — Austin's reliable heating and cooling service.",
            legalText: "© 2026 Northline HVAC",
          },
        },
      ],
    },
  ],
  navigation: {
    primary: [
      { label: "Services", href: "#services" },
      { label: "About", href: "#about" },
      { label: "Testimonials", href: "#testimonials" },
      { label: "Contact", href: "#contact" },
    ],
    footer: [
      { label: "Home", href: "/" },
      { label: "Services", href: "#services" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
      { label: "© 2026 Northline HVAC", href: "/" },
    ],
  },
  seo: {
    title: "Northline HVAC | Austin HVAC Repair & Installation",
    description:
      "Fast residential HVAC repair and installation in Austin, TX. Schedule service today.",
    keywords: ["AC repair", "HVAC Austin", "heater installation", "maintenance plans"],
  },
  styleConfig: {
    tone: "professional",
    style: "corporate",
    colorMood: "Trust-signaling blues with clean white backgrounds",
    typographyMood: "Structured sans-serif with strong readability",
  },
  sourceInput: businessSiteFixture,
  status: "draft",
  version: 1,
  generatedAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

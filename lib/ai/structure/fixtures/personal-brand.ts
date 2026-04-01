import type { WebsiteStructure } from "../types";
import { personalBrandFixture } from "../../prompts/fixtures";

/**
 * A complete personal-brand website structure fixture.
 * Represents the expected output for a friendly, minimalist coaching site
 * targeting first-time engineering managers.
 */
export const personalBrandStructureFixture: WebsiteStructure = {
  id: "ws_personal_fixture_001",
  userId: "user_fixture_001",
  websiteType: "personal-brand",
  siteTitle: "Jordan Vale",
  tagline: "Leadership coaching for first-time engineering managers.",
  pages: [
    {
      id: "page_home_personal_001",
      slug: "/",
      title: "Home",
      type: "home",
      order: 0,
      seo: {
        title: "Jordan Vale | Engineering Leadership Coach",
        description:
          "Leadership coaching for new managers leading teams of 3–10 engineers. Book your intro session.",
        keywords: [
          "engineering manager coaching",
          "leadership coach",
          "1:1 coaching",
          "team communication",
        ],
      },
      sections: [
        {
          id: "sec_hero_personal_001",
          type: "hero",
          order: 0,
          visible: true,
          content: {
            headline: "Lead with confidence from day one.",
            subheadline:
              "Coaching for first-time engineering managers ready to grow fast.",
            primaryCta: "Book a coaching intro",
          },
        },
        {
          id: "sec_about_personal_001",
          type: "about",
          order: 1,
          visible: true,
          content: {
            headline: "About Jordan",
            body: "Jordan Vale is a former VP Engineering with 12 years of leadership experience. After leading teams at several fast-growing companies, Jordan now coaches first-time managers so they can avoid the mistakes that slow most new leaders down.",
          },
        },
        {
          id: "sec_services_personal_001",
          type: "services",
          order: 2,
          visible: true,
          content: {
            headline: "How I work with you",
            items: [
              {
                name: "1:1 Coaching",
                description:
                  "Bi-weekly sessions focused on your specific challenges and goals.",
              },
              {
                name: "Team Communication Workshops",
                description:
                  "Practical workshops that help your team communicate clearly and ship faster.",
              },
            ],
          },
        },
        {
          id: "sec_cta_personal_001",
          type: "cta",
          order: 3,
          visible: true,
          content: {
            headline: "Ready to become the manager your team deserves?",
            ctaText: "Book a coaching intro",
          },
        },
        {
          id: "sec_contact_personal_001",
          type: "contact",
          order: 4,
          visible: true,
          content: {
            headline: "Get in touch",
            channels: [],
          },
        },
        {
          id: "sec_footer_personal_001",
          type: "footer",
          order: 5,
          visible: true,
          content: {
            shortBlurb: "Jordan Vale — engineering leadership coaching.",
            legalText: "© 2026 Jordan Vale",
          },
        },
      ],
    },
  ],
  navigation: {
    primary: [
      { label: "About", href: "#about" },
      { label: "Services", href: "#services" },
      { label: "Contact", href: "#contact" },
    ],
    footer: [
      { label: "Home", href: "/" },
      { label: "About", href: "#about" },
      { label: "Services", href: "#services" },
      { label: "Contact", href: "#contact" },
      { label: "© 2026 Jordan Vale", href: "/" },
    ],
  },
  seo: {
    title: "Jordan Vale | Engineering Leadership Coach",
    description:
      "Leadership coaching for new managers leading teams of 3–10 engineers. Book your intro session.",
    keywords: [
      "engineering manager coaching",
      "leadership coach",
      "1:1 coaching",
      "team communication",
    ],
  },
  styleConfig: {
    tone: "friendly",
    style: "minimalist",
    colorMood: "Warm neutrals with a single warm accent",
    typographyMood: "Clean sans-serif with generous white space",
  },
  sourceInput: personalBrandFixture,
  status: "draft",
  version: 1,
  generatedAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

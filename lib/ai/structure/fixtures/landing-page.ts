import type { WebsiteStructure } from "../types";
import { landingPageFixture } from "../../prompts/fixtures";

/**
 * A complete landing-page website structure fixture.
 * Represents the expected output for a bold, modern SaaS product landing page
 * targeting remote product teams.
 */
export const landingPageStructureFixture: WebsiteStructure = {
  id: "ws_landing_fixture_001",
  userId: "user_fixture_001",
  websiteType: "landing-page",
  siteTitle: "SprintBoard",
  tagline: "The planning tool remote product teams actually use.",
  pages: [
    {
      id: "page_home_landing_001",
      slug: "/",
      title: "Home",
      type: "home",
      order: 0,
      seo: {
        title: "SprintBoard | Sprint Planning for Remote Teams",
        description:
          "SprintBoard makes sprint planning fast and focused for seed to Series B product teams.",
        keywords: [
          "sprint planning",
          "roadmap sync",
          "priority scoring",
          "remote product teams",
        ],
      },
      sections: [
        {
          id: "sec_hero_landing_001",
          type: "hero",
          order: 0,
          visible: true,
          content: {
            headline: "Ship faster with your whole team aligned.",
            subheadline:
              "SprintBoard keeps sprints on track without the overhead.",
            primaryCta: "Start free trial",
            secondaryCta: "See how it works",
          },
        },
        {
          id: "sec_services_landing_001",
          type: "services",
          order: 1,
          visible: true,
          content: {
            headline: "Everything your team needs to sprint well",
            items: [
              {
                name: "Sprint Planning",
                description:
                  "Set goals, scope work, and assign tasks in under 15 minutes.",
              },
              {
                name: "Roadmap Sync",
                description:
                  "Keep your roadmap and sprint backlog in sync without manual updates.",
              },
              {
                name: "Priority Scoring",
                description:
                  "Score and sort backlog items by impact so the right work ships first.",
              },
            ],
          },
        },
        {
          id: "sec_testimonials_landing_001",
          type: "testimonials",
          order: 2,
          visible: true,
          content: {
            headline: "Teams that ship with SprintBoard",
            items: [],
          },
        },
        {
          id: "sec_cta_landing_001",
          type: "cta",
          order: 3,
          visible: true,
          content: {
            headline: "Ready to run better sprints?",
            ctaText: "Start free trial",
          },
        },
        {
          id: "sec_footer_landing_001",
          type: "footer",
          order: 4,
          visible: true,
          content: {
            shortBlurb: "SprintBoard — sprint planning built for remote teams.",
            legalText: "© 2026 SprintBoard",
          },
        },
      ],
    },
  ],
  navigation: {
    primary: [
      { label: "Features", href: "#services" },
      { label: "Testimonials", href: "#testimonials" },
    ],
    footer: [
      { label: "Home", href: "/" },
      { label: "Features", href: "#services" },
      { label: "Testimonials", href: "#testimonials" },
      { label: "© 2026 SprintBoard", href: "/" },
    ],
  },
  seo: {
    title: "SprintBoard | Sprint Planning for Remote Teams",
    description:
      "SprintBoard makes sprint planning fast and focused for seed to Series B product teams.",
    keywords: [
      "sprint planning",
      "roadmap sync",
      "priority scoring",
      "remote product teams",
    ],
  },
  styleConfig: {
    tone: "bold",
    style: "modern",
    colorMood: "High-contrast with energetic accent",
    typographyMood: "Strong sans-serif with benefit-first headings",
  },
  sourceInput: landingPageFixture,
  status: "draft",
  version: 1,
  generatedAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

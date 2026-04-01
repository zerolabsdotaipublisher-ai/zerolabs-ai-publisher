import type { WebsiteStructure } from "../types";
import { portfolioFixture } from "../../prompts/fixtures";

/**
 * A complete portfolio website structure fixture.
 * Represents the expected output of the generation pipeline for
 * a premium editorial photography portfolio.
 */
export const portfolioStructureFixture: WebsiteStructure = {
  id: "ws_portfolio_fixture_001",
  userId: "user_fixture_001",
  websiteType: "portfolio",
  siteTitle: "Maya Lens Studio",
  tagline: "Visual stories crafted for brands that care about craft.",
  pages: [
    {
      id: "page_home_portfolio_001",
      slug: "/",
      title: "Home",
      type: "home",
      order: 0,
      seo: {
        title: "Maya Lens Studio | Brand Photography",
        description:
          "Freelance photographer creating visual stories for early-stage lifestyle brands.",
        keywords: ["brand photography", "campaign direction", "photo retouching"],
      },
      sections: [
        {
          id: "sec_hero_portfolio_001",
          type: "hero",
          order: 0,
          visible: true,
          content: {
            headline: "Visual stories that define your brand.",
            subheadline:
              "Campaign photography for lifestyle brands ready to stand out.",
            primaryCta: "Book a discovery call",
            secondaryCta: "View work",
          },
        },
        {
          id: "sec_about_portfolio_001",
          type: "about",
          order: 1,
          visible: true,
          content: {
            headline: "Ten years behind the lens",
            body: "Maya Chen has spent over a decade shooting campaigns across fashion and hospitality. She founded Maya Lens Studio to give early-stage brands access to the same visual quality that defines leading names.",
          },
        },
        {
          id: "sec_services_portfolio_001",
          type: "services",
          order: 2,
          visible: true,
          content: {
            headline: "What I create",
            items: [
              {
                name: "Brand Photography",
                description:
                  "High-quality images that capture your brand's visual identity.",
              },
              {
                name: "Campaign Direction",
                description:
                  "Art direction from concept brief to final delivery.",
              },
              {
                name: "Photo Retouching",
                description:
                  "Polish every image to publication standard with precision.",
              },
            ],
          },
        },
        {
          id: "sec_contact_portfolio_001",
          type: "contact",
          order: 3,
          visible: true,
          content: {
            headline: "Let's work together",
            channels: [{ label: "Email", value: "maya@lens.example" }],
          },
        },
        {
          id: "sec_footer_portfolio_001",
          type: "footer",
          order: 4,
          visible: true,
          content: {
            shortBlurb: "Maya Lens Studio — visual stories for brands that mean it.",
            legalText: "© 2026 Maya Lens Studio",
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
      { label: "© 2026 Maya Lens Studio", href: "/" },
    ],
  },
  seo: {
    title: "Maya Lens Studio | Brand Photography",
    description:
      "Freelance photographer creating visual stories for early-stage lifestyle brands.",
    keywords: [
      "brand photography",
      "campaign direction",
      "photo retouching",
      "maya lens studio",
    ],
  },
  styleConfig: {
    tone: "premium",
    style: "editorial",
    colorMood: "Rich darks with warm accent tones",
    typographyMood: "Elegant serif headlines with clean body text",
  },
  sourceInput: portfolioFixture,
  status: "draft",
  version: 1,
  generatedAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

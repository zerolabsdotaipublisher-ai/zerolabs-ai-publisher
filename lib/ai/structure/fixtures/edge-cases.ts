import type { WebsiteStructure } from "../types";
import { edgeCaseFixture } from "../../prompts/fixtures";

/**
 * Edge-case website structure fixture.
 *
 * Tests the fallback system and custom tone/style handling.
 * The source input uses:
 *   - Whitespace-padded strings (sanitized by the prompt schema layer).
 *   - Custom tone + style (no preset — uses notes only).
 *   - Minimal services list after blank items are stripped.
 *   - No founder profile, testimonials, or contact info.
 *
 * The resulting structure demonstrates that:
 *   - Fallbacks fill in absent sections correctly.
 *   - Navigation omits sections with no content.
 *   - The structure still validates and is renderable.
 */
export const edgeCaseStructureFixture: WebsiteStructure = {
  id: "ws_edge_fixture_001",
  userId: "user_fixture_001",
  websiteType: "landing-page",
  siteTitle: "Lean Launch Lab",
  tagline: "The fastest way to get started.",
  pages: [
    {
      id: "page_home_edge_001",
      slug: "/",
      title: "Home",
      type: "home",
      order: 0,
      seo: {
        title: "Lean Launch Lab | The fastest way to get started.",
        description: "Lean Launch Lab — The fastest way to get started.",
        keywords: ["lean-launch-lab"],
      },
      sections: [
        {
          id: "sec_hero_edge_001",
          type: "hero",
          order: 0,
          visible: true,
          content: {
            headline: "Welcome",
            subheadline: "We are ready to help you.",
            primaryCta: "Get started",
          },
        },
        {
          id: "sec_services_edge_001",
          type: "services",
          order: 1,
          visible: true,
          content: {
            headline: "What We Offer",
            items: [
              {
                name: "MVP Scoping",
                description: "We provide excellent services.",
              },
              {
                name: "Experiment Design",
                description: "We provide excellent services.",
              },
            ],
          },
        },
        {
          id: "sec_footer_edge_001",
          type: "footer",
          order: 2,
          visible: true,
          content: {
            shortBlurb: "Thank you for visiting.",
          },
        },
      ],
    },
  ],
  navigation: {
    primary: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Sign Up", href: "#sign-up" },
    ],
    footer: [
      { label: "Home", href: "/" },
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Sign Up", href: "#sign-up" },
      { label: `© ${new Date().getFullYear()} Lean Launch Lab`, href: "/" },
    ],
  },
  seo: {
    title: "Lean Launch Lab | The fastest way to get started.",
    description: "Lean Launch Lab — The fastest way to get started.",
    keywords: ["lean-launch-lab"],
  },
  styleConfig: {
    tone: "custom",
    style: "custom",
    colorMood: "Clean neutrals with one accent color",
    typographyMood: "Readable sans-serif hierarchy",
  },
  sourceInput: edgeCaseFixture,
  status: "draft",
  version: 1,
  generatedAt: "2026-04-01T00:00:00.000Z",
  updatedAt: "2026-04-01T00:00:00.000Z",
};

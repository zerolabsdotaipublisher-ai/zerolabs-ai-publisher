import { landingPageStructureFixture } from "@/lib/ai/structure/fixtures";
import type { WebsiteSection, WebsiteStructure } from "@/lib/ai/structure";

export function createStandardMarketingSiteFixture(): WebsiteStructure {
  const structure = structuredClone(landingPageStructureFixture);
  const home = structure.pages[0];

  home.visible = true;
  home.navigation = {
    includeInHeader: true,
    includeInFooter: true,
    includeInSidebar: false,
  };
  home.navigationLabel = "Home";
  home.seo = {
    ...home.seo,
    canonicalUrl: "https://sprintboard.example/",
    openGraph: {
      title: "SprintBoard for remote teams",
      description: "Plan better sprints with SprintBoard.",
      type: "website",
      url: "https://sprintboard.example/",
      image: "https://cdn.example.test/sprintboard-og.png",
    },
  };
  home.sections = home.sections.map((section) => {
    if (section.type !== "hero") return section;
    return {
      ...section,
      content: {
        ...section.content,
        variant: "with-image",
        ctaHref: "/contact",
        image: {
          src: "https://cdn.example.test/sprintboard-hero.png",
          alt: "SprintBoard planning dashboard",
        },
      },
      components: [
        {
          id: "cmp_hero_supporting_copy",
          type: "paragraph",
          props: { text: "Planning clarity for remote teams." },
        },
      ],
    };
  });
  structure.navigation = {
    primary: [
      { label: "Home", href: "/", pageId: home.id },
      { label: "Features", href: "#services" },
      { label: "Contact", href: "https://sprintboard.example/contact", external: true },
    ],
    footer: [{ label: "Home", href: "/", pageId: home.id }],
  };
  structure.seo = {
    ...structure.seo,
    canonicalBaseUrl: "https://sprintboard.example",
    openGraph: {
      title: "SprintBoard",
      description: "The planning tool remote product teams actually use.",
      type: "website",
      url: "https://sprintboard.example",
      image: "https://cdn.example.test/sprintboard-og.png",
    },
  };

  return structure;
}

export function createMultiPageSiteFixture(): WebsiteStructure {
  const structure = createStandardMarketingSiteFixture();
  const home = structure.pages[0];
  const about = {
    id: "page_about_landing_001",
    slug: "/about",
    title: "About SprintBoard",
    type: "about" as const,
    order: 1,
    visible: true,
    navigation: {
      includeInHeader: true,
      includeInFooter: true,
      includeInSidebar: false,
    },
    navigationLabel: "About",
    seo: {
      title: "About SprintBoard",
      description: "Learn why SprintBoard helps remote product teams plan with clarity.",
      keywords: ["about sprintboard", "remote product planning"],
      canonicalUrl: "https://sprintboard.example/about",
    },
    sections: [
      {
        id: "sec_hero_about_001",
        type: "hero" as const,
        order: 0,
        visible: true,
        content: {
          headline: "Built for teams that value clarity.",
          primaryCta: "Talk to us",
          ctaHref: "/contact",
        },
      },
      {
        id: "sec_about_story_001",
        type: "about" as const,
        order: 1,
        visible: true,
        content: {
          headline: "Our story",
          body: "SprintBoard removes the friction from product planning.",
        },
      },
    ],
  };

  structure.pages = [home, about];
  structure.navigation.primary = [
    { label: "Home", href: "/", pageId: home.id },
    { label: "About", href: "/about", pageId: about.id },
    { label: "Features", href: "#services" },
  ];
  return structure;
}

export function createHiddenReorderedSiteFixture(): WebsiteStructure {
  const structure = createMultiPageSiteFixture();
  const home = structure.pages[0];
  const hero = home.sections.find((section) => section.type === "hero")!;
  const services = home.sections.find((section) => section.type === "services")!;
  const cta = home.sections.find((section) => section.type === "cta")!;

  home.sections = [
    { ...cta, order: 30 },
    { ...services, order: 20, visible: false },
    { ...hero, order: 10 },
  ];
  return structure;
}

export function createLegacyUnknownSectionFixture(): WebsiteStructure {
  const structure = createStandardMarketingSiteFixture();
  const unknownSection = {
    id: "sec_legacy_announcement_001",
    type: "announcement",
    order: 99,
    visible: false,
    content: {
      headline: "Legacy announcement",
      body: "This content must not disappear during adaptation.",
      action: { label: "Read more", href: "/legacy" },
    },
  } as unknown as WebsiteSection;

  structure.pages[0].sections = [...structure.pages[0].sections, unknownSection];
  return structure;
}

export function createVisibleLegacyUnknownSectionFixture(): WebsiteStructure {
  const structure = createLegacyUnknownSectionFixture();
  const legacySection = structure.pages[0].sections.find(
    (section) => section.id === "sec_legacy_announcement_001",
  );

  if (legacySection) {
    legacySection.visible = true;
  }
  return structure;
}

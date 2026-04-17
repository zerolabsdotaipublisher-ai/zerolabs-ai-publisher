import {
  businessSiteStructureFixture,
  landingPageStructureFixture,
} from "@/lib/ai/structure/fixtures";
import type { WebsitePage, WebsiteStructure } from "@/lib/ai/structure";
import type { PipelineDeploymentEnvironment } from "../types";

export interface StaticSiteScenario {
  id: string;
  name: string;
  environment: PipelineDeploymentEnvironment;
  structure: WebsiteStructure;
  expectedRoutePaths: string[];
  expectedValid: boolean;
  expectedBehavior: string;
}

const aboutPage: WebsitePage = {
  id: "page_about_static_001",
  slug: "/about",
  title: "About",
  type: "about",
  order: 1,
  visible: true,
  seo: {
    title: "About Northline HVAC",
    description: "Meet the local team behind Northline HVAC in Austin.",
    keywords: ["HVAC team", "Austin HVAC company"],
    canonicalUrl: "https://example.com/about",
    openGraph: {
      title: "About Northline HVAC",
      description: "Meet the local team behind Northline HVAC in Austin.",
      type: "website",
      url: "https://example.com/about",
      image: "/images/northline-team.webp",
    },
  },
  sections: [
    {
      id: "sec_about_static_001",
      type: "about",
      order: 0,
      visible: true,
      content: {
        headline: "Local HVAC technicians with clean workmanship.",
        body: "Northline HVAC keeps Austin homes comfortable with practical service and clear communication.",
        image: "/images/northline-crew.webp",
      },
    },
  ],
};

const contactPage: WebsitePage = {
  id: "page_contact_static_001",
  slug: "/contact",
  title: "Contact",
  type: "contact",
  order: 2,
  visible: true,
  seo: {
    title: "Contact Northline HVAC",
    description: "Schedule HVAC service with Northline HVAC in Austin.",
    keywords: ["schedule HVAC", "Austin AC service"],
    canonicalUrl: "https://example.com/contact",
  },
  sections: [
    {
      id: "sec_contact_static_001",
      type: "contact",
      order: 0,
      visible: true,
      content: {
        headline: "Schedule service",
        channels: [
          { label: "Phone", value: "+1-555-0140" },
          { label: "Location", value: "Austin, TX" },
        ],
      },
    },
  ],
};

export const multiPageStaticSiteStructureFixture: WebsiteStructure = {
  ...businessSiteStructureFixture,
  id: "ws_static_multi_page_fixture_001",
  siteTitle: "Northline HVAC Static",
  pages: [
    businessSiteStructureFixture.pages[0],
    aboutPage,
    contactPage,
  ],
  navigation: {
    ...businessSiteStructureFixture.navigation,
    primary: [
      { label: "Home", href: "/", pageId: businessSiteStructureFixture.pages[0].id },
      { label: "About", href: "/about", pageId: aboutPage.id },
      { label: "Contact", href: "/contact", pageId: contactPage.id },
    ],
    footer: [
      { label: "Home", href: "/", pageId: businessSiteStructureFixture.pages[0].id },
      { label: "About", href: "/about", pageId: aboutPage.id },
      { label: "Contact", href: "/contact", pageId: contactPage.id },
    ],
  },
};

export const hiddenPageStaticSiteStructureFixture: WebsiteStructure = {
  ...multiPageStaticSiteStructureFixture,
  id: "ws_static_hidden_page_fixture_001",
  pages: [
    multiPageStaticSiteStructureFixture.pages[0],
    {
      ...aboutPage,
      id: "page_about_hidden_static_001",
      visible: false,
    },
    contactPage,
  ],
};

export const invalidStaticSiteStructureFixture: WebsiteStructure = {
  ...landingPageStructureFixture,
  id: "ws_static_invalid_fixture_001",
  pages: [
    {
      ...landingPageStructureFixture.pages[0],
      id: "page_home_static_invalid_001",
      sections: [],
      seo: {
        ...landingPageStructureFixture.pages[0].seo,
        title: "",
      },
    },
  ],
};

export const staticSiteScenarios: StaticSiteScenario[] = [
  {
    id: "single-page-landing",
    name: "Single-page landing site",
    environment: "preview",
    structure: landingPageStructureFixture,
    expectedRoutePaths: ["/"],
    expectedValid: true,
    expectedBehavior: "The landing page produces one static page route and one page-data artifact.",
  },
  {
    id: "multi-page-business",
    name: "Multi-page business site",
    environment: "production",
    structure: multiPageStaticSiteStructureFixture,
    expectedRoutePaths: ["/", "/about", "/contact"],
    expectedValid: true,
    expectedBehavior: "Every visible page maps to a static route with page-level metadata and asset references.",
  },
  {
    id: "hidden-page-excluded",
    name: "Hidden page excluded",
    environment: "preview",
    structure: hiddenPageStaticSiteStructureFixture,
    expectedRoutePaths: ["/", "/contact"],
    expectedValid: true,
    expectedBehavior: "Hidden pages are excluded from route generation without breaking visible route coverage.",
  },
  {
    id: "invalid-page-blocked",
    name: "Invalid page blocked",
    environment: "production",
    structure: invalidStaticSiteStructureFixture,
    expectedRoutePaths: [],
    expectedValid: false,
    expectedBehavior: "Missing renderable sections and SEO metadata fail validation before deployment.",
  },
];


import type {
  NavigationPageSeed,
  NavigationPageType,
  PageNavigationFlags,
} from "./types";
import type { WebsiteType } from "../prompts/types";

interface DefaultPageDefinition {
  slug: string;
  title: string;
  type: NavigationPageType;
  priority: number;
  parentPageId?: string | null;
  navigation: PageNavigationFlags;
}

const NAV_DEFAULTS: Record<WebsiteType, DefaultPageDefinition[]> = {
  "small-business": [
    {
      slug: "/",
      title: "Home",
      type: "home",
      priority: 0,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
    {
      slug: "/about",
      title: "About",
      type: "about",
      priority: 20,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
    {
      slug: "/services",
      title: "Services",
      type: "services",
      priority: 10,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
    {
      slug: "/contact",
      title: "Contact",
      type: "contact",
      priority: 100,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
  ],
  portfolio: [
    {
      slug: "/",
      title: "Home",
      type: "home",
      priority: 0,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
    {
      slug: "/projects",
      title: "Projects",
      type: "services",
      priority: 10,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
    {
      slug: "/about",
      title: "About",
      type: "about",
      priority: 20,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
    {
      slug: "/contact",
      title: "Contact",
      type: "contact",
      priority: 100,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
  ],
  "landing-page": [
    {
      slug: "/",
      title: "Home",
      type: "home",
      priority: 0,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
    {
      slug: "/features",
      title: "Features",
      type: "services",
      priority: 10,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
    {
      slug: "/pricing",
      title: "Pricing",
      type: "custom",
      priority: 30,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
    {
      slug: "/contact",
      title: "Contact",
      type: "contact",
      priority: 100,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
  ],
  "personal-brand": [
    {
      slug: "/",
      title: "Home",
      type: "home",
      priority: 0,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
    {
      slug: "/about",
      title: "About",
      type: "about",
      priority: 20,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
    {
      slug: "/work",
      title: "Work",
      type: "services",
      priority: 10,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
    {
      slug: "/contact",
      title: "Contact",
      type: "contact",
      priority: 100,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
  ],
  blog: [
    {
      slug: "/",
      title: "Blog",
      type: "home",
      priority: 0,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
    {
      slug: "/latest",
      title: "Latest",
      type: "custom",
      priority: 10,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
  ],
  article: [
    {
      slug: "/",
      title: "Articles",
      type: "home",
      priority: 0,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
    {
      slug: "/featured",
      title: "Featured",
      type: "custom",
      priority: 10,
      navigation: { includeInHeader: true, includeInFooter: true, includeInSidebar: false },
    },
  ],
};

export function getDefaultPagesForWebsiteType(
  websiteType: WebsiteType,
): DefaultPageDefinition[] {
  return NAV_DEFAULTS[websiteType] ?? NAV_DEFAULTS["small-business"];
}

export function createDefaultPageSeeds(websiteType: WebsiteType): NavigationPageSeed[] {
  return getDefaultPagesForWebsiteType(websiteType).map((page, index) => ({
    id:
      page.slug === "/"
        ? "page_home"
        : `page_${page.slug.replace(/^\/+/, "").replace(/\//g, "_")}`,
    title: page.title,
    slug: page.slug,
    type: page.type,
    order: index,
    visible: true,
    parentPageId: page.parentPageId ?? null,
    priority: page.priority,
    includeInNavigation:
      page.navigation.includeInHeader ||
      page.navigation.includeInFooter ||
      page.navigation.includeInSidebar,
    navigationLabel: page.title,
  }));
}

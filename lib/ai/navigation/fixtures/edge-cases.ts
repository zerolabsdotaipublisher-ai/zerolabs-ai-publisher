import { generateValidatedWebsiteNavigation } from "../generator";

export const edgeCaseNavigationFixture = generateValidatedWebsiteNavigation(
  {
    websiteType: "small-business",
    siteTitle: "Edge Case Co",
    pages: [
      {
        id: "home",
        title: "Home",
        slug: "/",
        type: "home",
        order: 0,
        visible: true,
      },
      {
        id: "duplicate-about-a",
        title: "About",
        slug: "/about",
        type: "about",
        order: 1,
        visible: true,
      },
      {
        id: "duplicate-about-b",
        title: "About Team",
        slug: "/about",
        type: "about",
        order: 2,
        visible: true,
      },
    ],
  },
  {
    parentPageIds: {
      "duplicate-about-b": "duplicate-about-a",
    },
  },
);

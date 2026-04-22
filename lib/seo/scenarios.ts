import type { SeoSearchIntent } from "./types";

export interface SeoScenario {
  id: string;
  label: string;
  contentType: "website-page" | "blog" | "article";
  topic: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  searchIntent: SeoSearchIntent;
  targetAudience: string;
}

export const seoScenarios: SeoScenario[] = [
  {
    id: "b2b-saas-blog",
    label: "B2B SaaS informational blog",
    contentType: "blog",
    topic: "AI blog generation for SaaS teams",
    primaryKeyword: "AI blog generation",
    secondaryKeywords: ["SaaS SEO workflow", "content operations"],
    searchIntent: "informational",
    targetAudience: "SaaS marketing teams",
  },
  {
    id: "service-page-commercial",
    label: "Service page commercial intent",
    contentType: "website-page",
    topic: "AI publishing services",
    primaryKeyword: "AI publishing services",
    secondaryKeywords: ["content workflow platform", "website publishing pipeline"],
    searchIntent: "commercial",
    targetAudience: "B2B platform buyers",
  },
  {
    id: "guide-article-strategic",
    label: "Strategic guide article",
    contentType: "article",
    topic: "product-owned SEO systems",
    primaryKeyword: "product-owned SEO system",
    secondaryKeywords: ["SEO content generation", "AI publishing architecture"],
    searchIntent: "informational",
    targetAudience: "platform and content leaders",
  },
];

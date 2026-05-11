export interface WebsiteMediaLibraryScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const WEBSITE_MEDIA_LIBRARY_MVP_BOUNDARIES = [
  "Website media library logic stays inside AI Publisher and reuses existing media storage plus AI asset storage integrations.",
  "MVP covers upload, browse, preview, select, safe delete/archive, tags, search/filter, usage tracking, and responsive editor integration.",
  "Enterprise DAM governance, advanced CDN orchestration, collaborative asset governance, billing engines, and full image editing remain out of scope.",
] as const;

export const websiteMediaLibraryScenarios: WebsiteMediaLibraryScenario[] = [
  {
    id: "website-upload",
    name: "Website media upload",
    expectedBehavior: "Website-scoped uploads reuse the existing media workflow, then persist AI Publisher library metadata and initial usage context.",
  },
  {
    id: "ai-asset-sync",
    name: "AI asset reuse in website library",
    expectedBehavior: "AI-generated assets are synced into the website media library as reusable library items without duplicating storage objects.",
  },
  {
    id: "safe-delete",
    name: "Usage-aware media deletion",
    expectedBehavior: "Deleting used media archives the library item instead of hard-deleting the underlying asset, while unused media can be cleaned up safely.",
  },
  {
    id: "editor-selection",
    name: "Website editor insertion",
    expectedBehavior: "Website editors can browse/select media, insert signed URLs into website content fields, and track where assets are used.",
  },
];

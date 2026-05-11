export const websiteAssetRetrievalScenarios = [
  {
    id: "live-published-assets",
    title: "Published website assets resolve on live routes",
    expectedBehavior: "Anonymous live rendering receives safe website asset routes backed by cacheable delivery without exposing raw bucket paths.",
  },
  {
    id: "shared-preview-assets",
    title: "Shared preview tokens unlock preview asset retrieval",
    expectedBehavior: "Preview-token requests can resolve draft/private website assets only when the asset belongs to the shared preview website.",
  },
  {
    id: "editor-media-selection",
    title: "Editor media selection stores canonical website asset routes",
    expectedBehavior: "Website media library selections insert reusable website asset render URLs instead of short-lived preview URLs so editor/live rendering does not break.",
  },
  {
    id: "fallback-handling",
    title: "Missing or denied assets fall back safely",
    expectedBehavior: "Single-asset failures redirect to the placeholder fallback and log the miss without blocking the rest of the page render.",
  },
] as const;

export const WEBSITE_ASSET_RETRIEVAL_MVP_BOUNDARIES = [
  "website asset resolution by asset/media/AI asset/library/context identifiers",
  "editor, preview, live, media-library, and practical social handoff support",
  "signed/private retrieval with preview-token and owner enforcement",
  "cacheable published website delivery through safe app routes",
  "fallback redirects, structured logging, and route-level error handling",
] as const;

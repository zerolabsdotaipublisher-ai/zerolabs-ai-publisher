export interface AiAssetScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const AI_ASSET_MVP_BOUNDARIES = [
  "AI Publisher owns AI asset metadata, lifecycle, prompt context, associations, and retrieval APIs.",
  "MVP covers persistence, listing, signed retrieval, variants, replacement, and deletion cleanup for AI-generated images/assets.",
  "Storage and signed URLs reuse existing media storage/provider integration from ZLAP-STORY 10-1.",
  "Out of scope: full AI image generation platform, advanced DAM governance, CDN orchestration, and billing engine.",
] as const;

export const aiAssetScenarios: AiAssetScenario[] = [
  {
    id: "generated-upload-and-register",
    name: "Generated output persistence",
    expectedBehavior: "Generated output is uploaded to media storage and AI asset metadata/prompt context is persisted in AI Publisher.",
  },
  {
    id: "list-and-library",
    name: "Owner-scoped library listing",
    expectedBehavior: "Owners can list/filter AI assets with pagination, lifecycle status, and content associations.",
  },
  {
    id: "signed-access",
    name: "Secure retrieval",
    expectedBehavior: "AI asset retrieval uses signed URLs from media provider without exposing raw object paths.",
  },
  {
    id: "variants-and-replacement",
    name: "Original, variants, and replacement handling",
    expectedBehavior: "Variants and replacements preserve original relationships and lifecycle transitions.",
  },
  {
    id: "deletion-cleanup",
    name: "Deletion and cleanup",
    expectedBehavior: "Delete archives metadata, updates lifecycle, and removes underlying media objects with quota updates.",
  },
];

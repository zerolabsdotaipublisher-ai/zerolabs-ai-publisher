export interface MediaScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const MEDIA_MVP_BOUNDARIES = [
  "Media storage remains AI Publisher-owned (metadata, workflows, permissions, UI, and content associations).",
  "MVP covers upload, signed retrieval, owner-scoped listing, deletion cleanup, and reusable media library selection.",
  "Wasabi/S3-compatible provider abstraction is implemented for future provider extension without introducing a duplicate storage platform.",
  "Advanced DAM governance, CDN orchestration, and AI asset generation pipelines are future-ready and out of scope.",
] as const;

export const mediaScenarios: MediaScenario[] = [
  {
    id: "upload-and-metadata",
    name: "Upload and metadata persistence",
    expectedBehavior: "Uploaded files are validated, stored by provider adapter, and persisted with AI Publisher metadata.",
  },
  {
    id: "signed-access",
    name: "Signed URL access",
    expectedBehavior: "Owner-scoped media can generate short-lived signed access URLs without exposing raw storage credentials.",
  },
  {
    id: "owner-scoped-listing",
    name: "Owner-scoped pagination and filtering",
    expectedBehavior: "Listings return only authenticated owner records with pagination and lightweight filtering/search.",
  },
  {
    id: "deletion-cleanup",
    name: "Deletion and cleanup",
    expectedBehavior: "Delete removes provider object and soft-deletes metadata while updating usage/quota records.",
  },
  {
    id: "editing-library-integration",
    name: "Editing workflow media library integration",
    expectedBehavior: "Editing UI supports upload, browsing, and selecting reusable media assets with progress feedback.",
  },
];

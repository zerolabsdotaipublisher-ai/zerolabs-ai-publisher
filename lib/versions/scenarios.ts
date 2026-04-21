export interface WebsiteVersionScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const websiteVersionScenarios: WebsiteVersionScenario[] = [
  {
    id: "draft-save-creates-version",
    name: "Draft save version creation",
    expectedBehavior: "Saving a draft creates a product-owned version snapshot with draft status, current-draft marker, and snapshot summary metadata.",
  },
  {
    id: "publish-creates-live-version",
    name: "Publish creates live version",
    expectedBehavior: "Successful publish creates a published version snapshot linked to deployment metadata and marks it as the sole live version.",
  },
  {
    id: "history-listing-owner-only",
    name: "Version history retrieval",
    expectedBehavior: "Owners can list version history by website and retrieve individual version details; other users cannot.",
  },
  {
    id: "restore-previous-version",
    name: "Restore previous version",
    expectedBehavior: "Restoring a version safely replaces the current working WebsiteStructure state, regenerates routing, preserves publication metadata, and records a restore audit entry.",
  },
  {
    id: "comparison-summary",
    name: "Comparison summary",
    expectedBehavior: "Version comparison returns a lightweight typed summary of change kinds, pages, routes, and assets relative to the current working draft.",
  },
  {
    id: "single-live-version",
    name: "Live version uniqueness",
    expectedBehavior: "Only one version per website is marked live after a successful publish or update.",
  },
  {
    id: "deployment-linkage",
    name: "Deployment linkage",
    expectedBehavior: "Published versions store deployment identifiers, live URL/path data, and publication version linkage for traceability.",
  },
];

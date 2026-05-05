export interface WebsiteManagementScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const websiteManagementScenarios: WebsiteManagementScenario[] = [
  {
    id: "list-websites",
    name: "List websites",
    expectedBehavior: "Owned websites load in descending last-updated order with status and quick actions.",
  },
  {
    id: "search-filter",
    name: "Search and filter",
    expectedBehavior:
      "Search narrows by website name while status/publish-state/type filters keep only matching owner-scoped records.",
  },
  {
    id: "rename-website",
    name: "Rename and metadata update",
    expectedBehavior: "Title and optional description updates persist and refresh in list view without a full reload.",
  },
  {
    id: "navigation-actions",
    name: "Open preview/editor/generated routes",
    expectedBehavior: "Quick actions route to preview, editor, generated detail, and live URL when available.",
  },
  {
    id: "delete-confirmation",
    name: "Delete with confirmation",
    expectedBehavior: "Destructive action requires confirmation, enters deleting state, and soft-deleted site is hidden from default listing.",
  },
  {
    id: "delete-failure-retry",
    name: "Delete failure handling",
    expectedBehavior: "Deletion failure shows explicit error and allows retry without losing list state.",
  },
  {
    id: "ownership-denied",
    name: "Ownership validation",
    expectedBehavior: "API mutations for non-owned structure IDs return not found/denied and do not mutate data.",
  },
  {
    id: "status-badge-correctness",
    name: "Status badge correctness",
    expectedBehavior: "Published/pending/archived/deleted badges reflect publish metadata plus management deletion metadata.",
  },
  {
    id: "pagination-load-more",
    name: "Incremental loading",
    expectedBehavior: "Listing returns paginated records ordered by most recently updated and appends additional pages on demand.",
  },
  {
    id: "loading-error-state",
    name: "Loading and error handling",
    expectedBehavior: "List shows loading skeletons while fetching and an actionable retry state on retrieval failure.",
  },
];

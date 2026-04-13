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
    expectedBehavior: "Search narrows by title/description while status filter reflects draft/published/archived/deleted states.",
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
];

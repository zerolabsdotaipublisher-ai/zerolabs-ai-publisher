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
    id: "action-menu-availability",
    name: "Reusable action menu",
    expectedBehavior:
      "Each website card exposes a reusable action menu with edit/preview/manage/publish/rename/delete/settings entries.",
  },
  {
    id: "publish-status-actions",
    name: "Status-based publish actions",
    expectedBehavior:
      "Draft websites show Publish, websites with unpublished changes show Publish updates, and transitional states disable publishing actions.",
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
    id: "settings-entry",
    name: "Settings and advanced entry",
    expectedBehavior: "Action menu exposes website settings/deep management entry without creating a duplicate settings system.",
  },
  {
    id: "delete-confirmation",
    name: "Delete with confirmation",
    expectedBehavior:
      "Destructive action requires confirmation, enters deleting state, and soft-deleted site is hidden from default listing.",
  },
  {
    id: "publish-confirmation",
    name: "Publish confirmation safeguard",
    expectedBehavior: "Publish/publish-updates actions require explicit confirmation before state-changing API calls.",
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
    id: "archived-deleted-restrictions",
    name: "Archived/deleted action restrictions",
    expectedBehavior:
      "Archived and deleted websites hide or disable restricted management controls according to permissions rules.",
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
  {
    id: "responsive-actions",
    name: "Responsive controls",
    expectedBehavior: "Action controls remain usable and accessible on mobile with stacked layout and touch-safe button sizing.",
  },
  {
    id: "duplicate-future-ready",
    name: "Duplicate future-ready entry",
    expectedBehavior: "Duplicate action appears as disabled future-ready control without invoking unsafe or incomplete backend flows.",
  },
];

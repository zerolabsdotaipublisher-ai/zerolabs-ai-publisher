export interface PublishingActivityScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const PUBLISHING_ACTIVITY_MVP_BOUNDARIES = [
  "Publishing Activity Overview is an operational monitoring surface, not a full analytics/reporting platform.",
  "Overview reuses existing website publishing, scheduling, history, dashboard, and social systems.",
  "Quick actions only call existing routes and workflows; no duplicate publishing pipelines are introduced.",
  "Server-side aggregation is owner-scoped and query-bounded to avoid expensive per-item fan-out.",
] as const;

export const publishingActivityScenarios: PublishingActivityScenario[] = [
  {
    id: "owner-scoped-aggregation",
    name: "Owner-scoped activity aggregation",
    expectedBehavior: "Only data owned by the authenticated user appears in the activity overview.",
  },
  {
    id: "recent-upcoming-attention-segmentation",
    name: "Recent, upcoming, and attention segmentation",
    expectedBehavior: "Overview separates recent activity, future scheduled items, and failed/retry attention items.",
  },
  {
    id: "status-indicators",
    name: "Publishing status indicators",
    expectedBehavior: "Items display published, scheduled, failed, publishing, retry_pending, and canceled statuses.",
  },
  {
    id: "filter-platform-status-type-date",
    name: "Activity filters",
    expectedBehavior: "Platform, status, content type, and date range filters narrow aggregated results.",
  },
  {
    id: "quick-actions-existing-flows",
    name: "Quick actions into existing workflows",
    expectedBehavior: "Retry/edit/preview/open actions route into already supported APIs/pages without duplication.",
  },
  {
    id: "loading-empty-error",
    name: "Loading, empty, and error states",
    expectedBehavior: "Shell shows loading placeholders, contextual empty copy, and retryable error handling.",
  },
  {
    id: "timeline-grouping",
    name: "Timeline grouping",
    expectedBehavior: "Chronological timeline groups items by day for quick operational scan.",
  },
  {
    id: "dashboard-integration",
    name: "Dashboard + navigation integration",
    expectedBehavior: "Dashboard/activity entrypoints link to the full activity overview route.",
  },
];

export const socialPublishHistoryScenarios = [
  {
    id: "manual-instagram-request-to-published",
    description:
      "Manual Instagram publish writes requested, queued, publishing, and published lifecycle with request/response payloads.",
  },
  {
    id: "scheduled-instagram-delivery-failure-and-retry",
    description:
      "Scheduled publish writes failure details, retry timestamp, and retry linkage to the same history job.",
  },
  {
    id: "owner-filter-history-with-pagination",
    description:
      "Owner filters history by status/platform/date/account and paginates results without cross-tenant leakage.",
  },
  {
    id: "manual-retry-from-history",
    description:
      "Retry endpoint transitions history job to retry then re-executes linked Instagram publish job.",
  },
  {
    id: "audit-trace-completeness",
    description:
      "History detail includes immutable events, delivery records, content snapshot, and API payloads for debugging/audit.",
  },
] as const;

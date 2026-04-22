export const schedulingScenarios = [
  {
    id: "one-time-future-publish",
    description: "A one-time schedule publishes an existing draft later without generating new content.",
  },
  {
    id: "recurring-blog-generation",
    description: "A recurring blog schedule regenerates the stored blog draft before each publish/update execution.",
  },
  {
    id: "timezone-aware-article-monthly",
    description: "A monthly article schedule preserves the wall-clock time in the selected timezone across DST shifts.",
  },
  {
    id: "retryable-publish-failure",
    description: "A transient publish failure is retried with exponential backoff until the retry limit is reached.",
  },
  {
    id: "manual-run-after-failure",
    description: "An operator can manually trigger a failed schedule after fixing the underlying content or pipeline issue.",
  },
] as const;

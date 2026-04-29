export const socialSchedulingScenarios = [
  {
    id: "one-time-instagram-publish",
    description: "One-time Instagram schedule for an AI-generated post executes at a timezone-aware UTC due time.",
  },
  {
    id: "recurring-weekly-multi-platform",
    description: "Recurring weekly schedule targets Instagram now while retaining queued future platform targets.",
  },
  {
    id: "retry-after-transient-failure",
    description: "Retryable publishing failure moves schedule to retry_pending with bounded backoff.",
  },
  {
    id: "throttled-queue-attention-required",
    description: "Queue guardrails throttle high-load execution and create attention-required events.",
  },
  {
    id: "manual-run-owner-only",
    description: "Owner-triggered manual run enforces access control and records run + event lifecycle.",
  },
] as const;

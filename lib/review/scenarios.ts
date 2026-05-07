export interface ReviewScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const REVIEW_MVP_BOUNDARIES = [
  "Review interface is an owner-scoped content QA workflow, not a full collaborative approval suite.",
  "Review logic stays inside AI Publisher and reuses existing content storage, preview, editing, regeneration, and publishing flows.",
  "Version comparison and threaded comments are future-ready metadata surfaces for MVP, not full diff or collaboration systems.",
  "Reject/needs-changes states block publishing readiness via review workflow gating instead of introducing a duplicate publishing pipeline.",
] as const;

export const reviewScenarios: ReviewScenario[] = [
  {
    id: "list-owned-review-items",
    name: "List owner-scoped review queue",
    expectedBehavior: "Authenticated users see only their own generated website/blog/article/social content in review queue.",
  },
  {
    id: "review-state-model",
    name: "Review state transitions",
    expectedBehavior: "Items resolve to pending_review, approved, rejected, needs_changes, or published based on stored decision + content lifecycle.",
  },
  {
    id: "approve-reject-actions",
    name: "Approve and reject controls",
    expectedBehavior: "Approve marks publish-ready; reject/needs_changes capture note and block publish readiness.",
  },
  {
    id: "preview-edit-regenerate",
    name: "Preview, edit, and regenerate integration",
    expectedBehavior: "Review detail reuses existing preview/editor/regenerate flows without duplicating CMS or pipeline.",
  },
  {
    id: "loading-empty-error-responsive",
    name: "Loading, empty, error, and responsive states",
    expectedBehavior: "Review pages provide loading skeletons, empty states, retryable errors, and responsive layout behavior.",
  },
  {
    id: "publishing-workflow-gate",
    name: "Publishing workflow integration",
    expectedBehavior: "Publishing routes reject requests when linked review state is rejected/needs_changes for the structure.",
  },
  {
    id: "future-ready-version-commenting",
    name: "Future-ready version/comments",
    expectedBehavior: "Version comparison and comments/feedback are modeled and surfaced as MVP-safe future-ready capabilities.",
  },
];

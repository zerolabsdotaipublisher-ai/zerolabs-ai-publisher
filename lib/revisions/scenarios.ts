export interface RevisionScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const REVISION_MVP_BOUNDARIES = [
  "Revision history stays inside AI Publisher and reuses existing content, editing, review, approval, and publishing systems.",
  "MVP includes list, detail, compare summary, and restore with server-side ownership checks; full rich-text diff is future-ready.",
  "Autosave revisions are checkpointed and throttled to avoid noisy snapshot spam.",
  "Restore writes a new revision and routes content back through existing review/approval gates before publish.",
] as const;

export const revisionScenarios: RevisionScenario[] = [
  {
    id: "creation-and-editing-revisions",
    name: "Creation and editing checkpoints",
    expectedBehavior: "Initial snapshot and manual edit saves create sequential revisions with metadata and summaries.",
  },
  {
    id: "autosave-throttling",
    name: "Autosave throttling",
    expectedBehavior: "Autosave writes checkpoint revisions only when meaningful and not on every keystroke.",
  },
  {
    id: "ai-regeneration-revisions",
    name: "AI regeneration",
    expectedBehavior: "AI regeneration for website/blog/article/social content records a revision snapshot.",
  },
  {
    id: "approval-and-publishing-revisions",
    name: "Approval and publishing lifecycle",
    expectedBehavior: "Approval actions and publish/update events record revision and audit entries.",
  },
  {
    id: "compare-and-restore",
    name: "Compare and restore",
    expectedBehavior: "Users can compare any two revisions and restore one, creating a new rollback revision.",
  },
];

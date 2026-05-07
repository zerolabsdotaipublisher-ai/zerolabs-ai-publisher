export interface EditingScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const EDITING_MVP_BOUNDARIES = [
  "Editing logic stays inside AI Publisher and reuses existing storage, review, versioning, preview, regeneration, and publishing systems.",
  "Editing MVP supports owner-scoped single-user editing, not collaborative CMS workflows.",
  "Media editing is URL/reference replacement only; full media library management is out of scope.",
  "Undo/redo is future-ready metadata in MVP and not a full timeline editor.",
  "Published/live content is not updated by edit saves alone; publish/update workflow is still required.",
] as const;

export const editingScenarios: EditingScenario[] = [
  {
    id: "edit-owned-content",
    name: "Edit owner-scoped generated content",
    expectedBehavior: "Authenticated users can edit only their own website pages, blogs, articles, and social posts.",
  },
  {
    id: "save-and-autosave",
    name: "Manual save and autosave",
    expectedBehavior: "Manual save and throttled autosave persist draft changes and surface state feedback.",
  },
  {
    id: "review-reentry",
    name: "Review workflow re-entry",
    expectedBehavior: "Edits reset approved/published items to pending review and keep blocked states where applicable.",
  },
  {
    id: "validation-and-errors",
    name: "Validation and error handling",
    expectedBehavior: "Required title/content/structure fields are validated with actionable error messages.",
  },
  {
    id: "version-integration",
    name: "Version integration",
    expectedBehavior: "Website edits create snapshots via existing versioning; non-website edits expose future-ready snapshot hooks.",
  },
];

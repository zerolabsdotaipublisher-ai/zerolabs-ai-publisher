export const REGENERATION_MVP_BOUNDARIES = [
  "Controlled regenerate-preview-apply workflow only",
  "No autonomous or bulk regeneration",
  "No overwrite without explicit apply",
  "Reuse existing generation/editing/review/approval/revision systems",
  "No regeneration logic under services/zeroflow",
] as const;

export const regenerationScenarios = [
  {
    id: "review-regeneration-preview",
    label: "Reviewer regenerates content and compares changes before apply",
  },
  {
    id: "editor-regeneration-section",
    label: "Editor regenerates a single section while preserving other edits",
  },
  {
    id: "library-regeneration-reentry",
    label: "Content library action regenerates draft and re-enters review state",
  },
];


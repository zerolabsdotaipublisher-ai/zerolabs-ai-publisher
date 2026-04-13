export interface WebsiteEditorScenario {
  id: string;
  name: string;
  description: string;
  expected: string[];
}

export const websiteEditorScenarios: WebsiteEditorScenario[] = [
  {
    id: "editor-load-existing-website",
    name: "Load existing website",
    description: "Open /editor/{id} for an owned structure and initialize state from stored draft data.",
    expected: [
      "Editor route loads existing website structure",
      "Page and section selectors initialize to first page/section",
      "Canvas renders using existing generated-site renderer",
    ],
  },
  {
    id: "editor-text-edit-preview-sync",
    name: "Text edits update preview",
    description: "Update section text fields and verify immediate preview updates.",
    expected: [
      "Text panel updates section content in draft state",
      "Preview canvas updates without full page reload",
      "Dirty state changes to true after first edit",
    ],
  },
  {
    id: "editor-section-visibility-and-order",
    name: "Section visibility and reorder",
    description: "Toggle section visibility and reorder sections within a page.",
    expected: [
      "Section visibility toggle updates renderer output",
      "Reorder action updates section order and preview order",
      "Invalid reorder payload is rejected",
    ],
  },
  {
    id: "editor-navigation-editing",
    name: "Navigation editing",
    description: "Rename, reorder, and hide navigation items from primary/footer menus.",
    expected: [
      "Navigation label changes reflect in preview navigation",
      "Reorder updates menu sequence",
      "Visibility toggle excludes menu item from navigation",
    ],
  },
  {
    id: "editor-save-and-dirty-warning",
    name: "Save draft and unsaved warning",
    description: "Save edited drafts and verify beforeunload warning for unsaved changes.",
    expected: [
      "Save draft persists via existing structure storage",
      "Save success clears dirty state",
      "Unsaved warning appears before leaving with dirty changes",
    ],
  },
  {
    id: "editor-validation-and-responsive",
    name: "Validation and responsive behavior",
    description: "Test invalid slug handling, save error rendering, and small-screen layout stacking.",
    expected: [
      "Invalid slug blocks save with clear validation error",
      "Save API errors render in editor error panel",
      "Editor sidebars/panels stack on mobile widths",
    ],
  },
];

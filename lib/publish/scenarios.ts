export interface PublishScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const publishScenarios: PublishScenario[] = [
  {
    id: "first-publish-success",
    name: "First publish",
    expectedBehavior: "Draft website publishes successfully, status becomes published, and live URL is shown.",
  },
  {
    id: "published-update-success",
    name: "Update published website",
    expectedBehavior: "Saved draft changes on a published website are delivered and publication timestamp updates.",
  },
  {
    id: "blocked-unsaved-editor-changes",
    name: "Unsaved editor changes blocked",
    expectedBehavior: "Publish control is disabled while editor has unsaved local changes.",
  },
  {
    id: "blocked-validation",
    name: "Eligibility validation blocked",
    expectedBehavior: "Invalid website structure cannot publish and shows clear validation feedback.",
  },
  {
    id: "publish-failure-retry",
    name: "Failure and retry",
    expectedBehavior: "Failed publish keeps draft intact, displays recovery messaging, and allows retry.",
  },
  {
    id: "permission-denied",
    name: "Permission denied",
    expectedBehavior: "Unauthorized publish attempts are rejected in API and UI remains read-only.",
  },
  {
    id: "status-and-live-link-updates",
    name: "Status indicators update",
    expectedBehavior: "Editor and preview indicators reflect publication state and show the live link after publish.",
  },
];

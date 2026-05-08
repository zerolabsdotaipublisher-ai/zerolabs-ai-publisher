export interface ManualOverrideScenarioDefinition {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const MANUAL_OVERRIDE_MVP_BOUNDARIES = [
  "Manual override remains in AI Publisher and reuses existing publish/schedule/approval/revision systems.",
  "MVP supports explicit operator reason + confirmation + server-side permission checks, not enterprise policy engines.",
  "Approval bypass is allowed only for authorized override roles and is always audited.",
  "Override updates existing schedule and publish metadata to prevent duplicate execution.",
] as const;

export const manualOverrideScenarios: ManualOverrideScenarioDefinition[] = [
  {
    id: "urgent-publish",
    name: "Urgent publish",
    expectedBehavior: "An authorized user can trigger immediate publish/update with required reason and audit trail.",
  },
  {
    id: "hotfix-update",
    name: "Hotfix update",
    expectedBehavior: "A live website can be immediately updated for hotfixes while preserving publish workflow safeguards.",
  },
  {
    id: "bypass-scheduled-time",
    name: "Bypass scheduled time",
    expectedBehavior: "Manual override executes immediately and disables pending schedule execution to avoid duplicates.",
  },
  {
    id: "approval-bypass-authorized",
    name: "Approval bypass (authorized)",
    expectedBehavior: "Only admin/authorized approver override roles can bypass approval gates, with bypass metadata logged.",
  },
  {
    id: "social-manual-override",
    name: "Social manual publish",
    expectedBehavior: "Social override uses existing Instagram publishing path and records history metadata and override audit.",
  },
];

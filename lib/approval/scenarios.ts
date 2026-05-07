export interface ApprovalScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const APPROVAL_MVP_BOUNDARIES = [
  "Approval workflow is owner-scoped inside AI Publisher and reuses existing review/editing/publishing systems.",
  "MVP includes single-level approval with future-ready metadata for multi-level approval, not enterprise compliance orchestration.",
  "Commenting is lightweight feedback threading with server-side ownership enforcement.",
  "Publishing stays in the existing pipeline and is blocked for content that is not approved or published.",
] as const;

export const approvalScenarios: ApprovalScenario[] = [
  {
    id: "approval-state-coverage",
    name: "Approval state coverage",
    expectedBehavior:
      "Content resolves to draft, pending_approval, approved, rejected, needs_changes, or published across supported content types.",
  },
  {
    id: "submit-approve-reject-request-changes",
    name: "Action workflow",
    expectedBehavior:
      "Submit, approve, reject, and request changes actions transition state with ownership checks and audit trail updates.",
  },
  {
    id: "comment-feedback-thread",
    name: "Feedback thread",
    expectedBehavior: "Users can add lightweight approval comments and read ordered feedback thread history for owned content.",
  },
  {
    id: "publishing-block-unapproved",
    name: "Publishing gate",
    expectedBehavior:
      "Publishing/update APIs block structures that still have draft, pending_approval, rejected, or needs_changes content linked.",
  },
  {
    id: "edit-resubmit",
    name: "Editing integration",
    expectedBehavior: "After rejection or changes requested, edited content can be resubmitted for approval from approval action bar.",
  },
];

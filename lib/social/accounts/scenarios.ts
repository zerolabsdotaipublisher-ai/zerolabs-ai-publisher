export const socialAccountConnectionScenarios = [
  {
    id: "instagram-connect-success",
    description:
      "Owner starts Instagram OAuth, callback validates state, exchanges token, maps account profile, and stores connected status.",
  },
  {
    id: "oauth-callback-denied-permission",
    description:
      "Callback handles provider-denied access and preserves owner-visible actionable error response.",
  },
  {
    id: "invalid-or-expired-state",
    description:
      "Callback rejects invalid/expired OAuth state to prevent CSRF-style account hijacking.",
  },
  {
    id: "token-refresh-and-reauthorization",
    description:
      "Refresh succeeds for valid credentials and marks status reauthorization_required on refresh failure.",
  },
  {
    id: "owner-scoped-list-refresh-disconnect",
    description:
      "Only owner can list, view, refresh, and disconnect account connections with no cross-user leakage.",
  },
] as const;

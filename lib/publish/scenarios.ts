export interface PublishScenario {
  id: string;
  name: string;
  expectedBehavior: string;
}

export const publishScenarios: PublishScenario[] = [
  {
    id: "first-publish-success",
    name: "First publish",
    expectedBehavior: "Draft website publishes successfully, records an initial deployment version, and exposes the live URL.",
  },
  {
    id: "published-update-success",
    name: "Update published website",
    expectedBehavior: "Saved draft changes on a published website produce an app-owned deployment update plan, redeploy successfully, and advance live version history.",
  },
  {
    id: "no-op-update",
    name: "No-op update",
    expectedBehavior: "Manual update requests with no deployment-relevant changes are safely acknowledged without replacing the current live deployment.",
  },
  {
    id: "publish-failure-preserves-live-version",
    name: "Failure preserves live version",
    expectedBehavior: "Failed deployment updates keep the previous stable live URL/version active and store retryable error metadata.",
  },
  {
    id: "publish-failure-retry",
    name: "Failure and retry",
    expectedBehavior: "Retrying a failed deployment update reuses the same workflow, clears the failure when successful, and records retry metadata.",
  },
  {
    id: "concurrent-update-requests",
    name: "Concurrent update requests",
    expectedBehavior: "Overlapping update triggers for the same website are de-duplicated through queue metadata and optimistic persistence guards.",
  },
  {
    id: "routing-change-update",
    name: "Routing change update",
    expectedBehavior: "Saved route or redirect changes produce a routing-scoped deployment update while preserving live domain ownership metadata.",
  },
  {
    id: "metadata-only-update",
    name: "Metadata-only update",
    expectedBehavior: "SEO-only edits generate metadata-only deployment scope and targeted cache invalidation metadata.",
  },
  {
    id: "rollback-ready-history",
    name: "Version history and rollback-ready metadata",
    expectedBehavior: "Each successful publish/update adds version history, live version markers, and rollback-ready metadata without introducing provider rollback orchestration.",
  },
  {
    id: "cache-invalidation-metadata",
    name: "Cache invalidation metadata",
    expectedBehavior: "Successful deployments record provider-neutral cache refresh metadata aligned with the affected SSG routes and assets.",
  },
  {
    id: "permission-denied",
    name: "Permission denied",
    expectedBehavior: "Unauthorized publish attempts are rejected in API and UI remains read-only.",
  },
];

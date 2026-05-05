import type { DashboardSocialSummary } from "@/lib/dashboard";

interface DashboardSocialSummaryProps {
  summary: DashboardSocialSummary;
}

export function DashboardSocialSummarySection({ summary }: DashboardSocialSummaryProps) {
  return (
    <section className="dashboard-panel-shell" aria-label="Social media summary">
      <header>
        <h2>Social media activity</h2>
        <p>Connection, scheduling, and publish outcomes from social systems.</p>
      </header>
      <dl className="dashboard-definition-grid">
        <div>
          <dt>Connected accounts</dt>
          <dd>{summary.connectedAccounts}</dd>
        </div>
        <div>
          <dt>Accounts needing attention</dt>
          <dd>{summary.accountsNeedingAttention}</dd>
        </div>
        <div>
          <dt>Generated social posts</dt>
          <dd>{summary.generatedPosts}</dd>
        </div>
        <div>
          <dt>Scheduled social posts</dt>
          <dd>{summary.scheduledPosts}</dd>
        </div>
        <div>
          <dt>Published social posts</dt>
          <dd>{summary.publishedPosts}</dd>
        </div>
        <div>
          <dt>Failed social publishes</dt>
          <dd>{summary.failedPublishes}</dd>
        </div>
      </dl>
    </section>
  );
}

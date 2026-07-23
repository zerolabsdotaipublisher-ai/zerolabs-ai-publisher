import { getAdminDashboardData } from "@/lib/admin/data";
import { getVercelIntegrationOverview } from "@/lib/admin/vercel";

export const dynamic = "force-dynamic";

function renderMetric(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function renderMetricValue(value: number, isAvailable: boolean): string {
  return isAvailable ? renderMetric(value) : "Unavailable";
}

export default async function AdminAnalyticsPage() {
  const [dashboard, vercel] = await Promise.all([getAdminDashboardData(), getVercelIntegrationOverview()]);
  const internalMetricsAvailable = dashboard.analytics.internalMetricsAvailable;

  return (
    <section className="admin-page-shell" aria-label="Admin analytics page">
      <header className="admin-page-header">
        <div>
          <span className="admin-page-kicker">Analytics</span>
          <h1>Admin Analytics</h1>
          <p>
            This page reports internal platform counts from Supabase and labels external traffic analytics honestly when
            no real source is wired in.
          </p>
        </div>
      </header>

      <div className="admin-stat-grid" aria-label="Analytics summary cards">
        <article className="admin-stat-card">
          <span className="admin-stat-label">Generated websites</span>
          <strong className="admin-stat-value">
            {renderMetricValue(dashboard.analytics.generatedLast30Days, internalMetricsAvailable)}
          </strong>
          <span className="admin-stat-hint">Website records generated in the last 30 days</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Stored versions</span>
          <strong className="admin-stat-value">
            {renderMetricValue(dashboard.analytics.versionsStored, dashboard.websites.versionsAvailable)}
          </strong>
          <span className="admin-stat-hint">Total records currently stored in website_versions</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Admin users</span>
          <strong className="admin-stat-value">{renderMetricValue(dashboard.users.admins, dashboard.users.isAvailable)}</strong>
          <span className="admin-stat-hint">Role count from public.profiles</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Standard users</span>
          <strong className="admin-stat-value">{renderMetricValue(dashboard.users.standard, dashboard.users.isAvailable)}</strong>
          <span className="admin-stat-hint">Non-admin profile records currently tracked</span>
        </article>
      </div>

      <div className="admin-content-grid">
        <section className="admin-panel admin-panel-wide" aria-label="Analytics status">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Platform metrics</span>
              <h2>Current admin analytics foundation</h2>
              <p>
                Internal counts are real. Visitor or traffic numbers are not fabricated when the external analytics
                source is unavailable.
              </p>
            </div>
          </header>

          <div className="admin-overview-grid">
            <article className="admin-surface-card">
              <span className="admin-surface-label">Recent generation activity</span>
              <strong>{renderMetricValue(dashboard.analytics.generatedLast30Days, internalMetricsAvailable)}</strong>
              <p>Website structures generated in the last 30 days.</p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Version activity</span>
              <strong>{renderMetricValue(dashboard.analytics.versionActivityLast30Days, dashboard.websites.versionsAvailable)}</strong>
              <p>Version rows created in the last 30 days.</p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Live website records</span>
              <strong>{renderMetricValue(dashboard.websites.live, dashboard.websites.isAvailable)}</strong>
              <p>Website structure rows currently marked published.</p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Traffic analytics</span>
              <strong>{vercel.analytics.statusLabel}</strong>
              <p>{vercel.analytics.message}</p>
            </article>
          </div>
        </section>

        <section className="admin-panel" aria-label="Analytics readiness">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Readiness</span>
              <h2>External analytics readiness</h2>
              <p>Safe status checks for the current Vercel integration and the internal count sources.</p>
            </div>
          </header>

          <ul className="admin-check-list">
            {vercel.checks.map((check) => (
              <li
                key={check.id}
                className={`admin-check${check.status === "missing" || check.status === "unavailable" ? " admin-check-warning" : ""}`}
              >
                <strong>{check.label}</strong>
                <span>{check.detail}</span>
              </li>
            ))}
          </ul>

          <div className="admin-list-shell">
            <div className="admin-list-heading">
              <h3>Internal metric sources</h3>
              <p>These counts stay inside the product database and do not rely on external traffic analytics.</p>
            </div>
            <ul className="admin-key-value-list">
              <li>
                <span>Generated website records</span>
                <strong>{renderMetricValue(dashboard.websites.total, dashboard.websites.isAvailable)}</strong>
              </li>
              <li>
                <span>Draft website records</span>
                <strong>{renderMetricValue(dashboard.websites.drafts, dashboard.websites.isAvailable)}</strong>
              </li>
              <li>
                <span>Live versions stored</span>
                <strong>{renderMetricValue(dashboard.analytics.liveVersions, dashboard.websites.versionsAvailable)}</strong>
              </li>
              <li>
                <span>User growth in 30 days</span>
                <strong>{renderMetricValue(dashboard.analytics.userGrowthLast30Days, dashboard.users.isAvailable)}</strong>
              </li>
            </ul>
          </div>

          <div className="admin-empty-state">
            <strong>No fake production metrics</strong>
            <p>
              Until a real traffic analytics endpoint is wired in, this page shows only internal platform counts plus
              external readiness details.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}

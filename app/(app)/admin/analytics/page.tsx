import { getAdminDashboardData } from "@/lib/admin/data";
import { getVercelIntegrationOverview } from "@/lib/admin/vercel";

export const dynamic = "force-dynamic";

function renderMetric(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export default async function AdminAnalyticsPage() {
  const [dashboard, vercel] = await Promise.all([getAdminDashboardData(), getVercelIntegrationOverview()]);

  return (
    <section className="admin-page-shell" aria-label="Admin analytics page">
      <header className="admin-page-header">
        <div>
          <span className="admin-page-kicker">Analytics</span>
          <h1>Admin Analytics</h1>
          <p>
            Stable platform metrics plus a Vercel analytics readiness layer. This page does not invent visitor numbers
            when no real analytics payload is available.
          </p>
        </div>
      </header>

      <div className="admin-stat-grid" aria-label="Analytics summary cards">
        <article className="admin-stat-card">
          <span className="admin-stat-label">Website generation volume</span>
          <strong className="admin-stat-value">{renderMetric(dashboard.analytics.websiteGenerationVolume)}</strong>
          <span className="admin-stat-hint">Generated websites in the last 30 days</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Publishing activity</span>
          <strong className="admin-stat-value">{renderMetric(dashboard.analytics.publishingActivity)}</strong>
          <span className="admin-stat-hint">Published website records tracked by the platform</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">User growth</span>
          <strong className="admin-stat-value">{renderMetric(dashboard.analytics.userGrowth)}</strong>
          <span className="admin-stat-hint">New accounts detected in the last 30 days</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Vercel analytics</span>
          <strong className="admin-stat-value">{vercel.analytics.available ? "Available" : "Unavailable"}</strong>
          <span className="admin-stat-hint">{vercel.analytics.message}</span>
        </article>
      </div>

      <div className="admin-content-grid">
        <section className="admin-panel admin-panel-wide" aria-label="Analytics status">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Platform metrics</span>
              <h2>Current admin analytics foundation</h2>
              <p>
                These metrics are real platform counts. Visitor analytics are not fabricated when Vercel analytics data
                is unavailable.
              </p>
            </div>
          </header>

          <div className="admin-overview-grid">
            <article className="admin-surface-card">
              <span className="admin-surface-label">Recent generations</span>
              <strong>{renderMetric(dashboard.analytics.websiteGenerationVolume)}</strong>
              <p>Website generation volume measured over the last 30 days.</p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Published websites</span>
              <strong>{renderMetric(dashboard.websites.published)}</strong>
              <p>Published website records currently visible to the platform.</p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Recent signups</span>
              <strong>{renderMetric(dashboard.users.recentSignups)}</strong>
              <p>New user signups detected in the last seven days.</p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Analytics state</span>
              <strong>{vercel.analytics.available ? "Configured" : "Pending"}</strong>
              <p>{vercel.analytics.message}</p>
            </article>
          </div>
        </section>

        <section className="admin-panel" aria-label="Analytics readiness">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Readiness</span>
              <h2>Vercel analytics readiness</h2>
              <p>Configuration status for future analytics expansion.</p>
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

          <div className="admin-empty-state">
            <strong>No fake production metrics</strong>
            <p>
              This page only shows platform counts and configuration readiness until a real Vercel analytics feed is
              added.
            </p>
          </div>
        </section>
      </div>
    </section>
  );
}

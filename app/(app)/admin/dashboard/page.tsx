import Link from "next/link";
import { config, routes } from "@/config";
import { formatAdminDate, getAdminDashboardData } from "@/lib/admin/data";
import { formatVercelState, getVercelIntegrationOverview } from "@/lib/admin/vercel";

export const dynamic = "force-dynamic";

const quickLinks = [
  {
    href: routes.adminDeployments,
    kicker: "Vercel",
    label: "Open deployments",
    description: "Inspect recent builds, deployment state, and environment readiness.",
  },
  {
    href: routes.adminAnalytics,
    kicker: "Traffic",
    label: "Open analytics",
    description: "See platform metrics and Vercel analytics readiness without fake production numbers.",
  },
  {
    href: routes.adminUsers,
    kicker: "Access",
    label: "Manage admin users",
    description: "Grant admin access to existing accounts using a protected server action.",
  },
];

function renderMetric(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function getCheckClass(status: string): string {
  if (status === "missing" || status === "unavailable") {
    return "admin-check admin-check-warning";
  }

  return "admin-check";
}

export default async function AdminDashboardPage() {
  const [dashboard, vercel] = await Promise.all([getAdminDashboardData(), getVercelIntegrationOverview()]);
  const latestDeployment = vercel.latestDeployment;
  const serviceChecks = [
    { label: "Supabase", value: "Configured" },
    { label: "Media provider", value: config.services.media.provider },
    { label: "Publishing", value: config.features.enablePublishing ? "Enabled" : "Disabled" },
    { label: "Runtime", value: config.app.environment },
  ];

  return (
    <section className="admin-page-shell" aria-label="Admin dashboard homepage">
      <header className="admin-page-header">
        <div>
          <span className="admin-page-kicker">Zero Labs operations</span>
          <h1>Admin Dashboard</h1>
          <p>
            Separate server-rendered admin workspace for deployment visibility, platform health, analytics readiness,
            and access control.
          </p>
        </div>
        <div className="admin-page-actions">
          <Link href={routes.adminDeployments} className="admin-page-action-link">
            View deployments
          </Link>
          <Link href={routes.adminUsers} className="admin-page-action-link admin-page-action-link-secondary">
            Manage admin users
          </Link>
        </div>
      </header>

      <div className="admin-stat-grid" aria-label="Admin dashboard summary cards">
        <article className="admin-stat-card">
          <span className="admin-stat-label">Latest deployment</span>
          <strong className="admin-stat-value">
            {latestDeployment ? formatVercelState(latestDeployment.state) : "Not configured"}
          </strong>
          <span className="admin-stat-hint">
            {latestDeployment ? `Created ${formatAdminDate(latestDeployment.createdAt)}` : vercel.status.message}
          </span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Platform health</span>
          <strong className="admin-stat-value">{dashboard.monitoring.systemStatus}</strong>
          <span className="admin-stat-hint">
            {renderMetric(dashboard.monitoring.failedJobs)} tracked failed jobs or retries
          </span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Admin accounts</span>
          <strong className="admin-stat-value">{renderMetric(dashboard.users.admins)}</strong>
          <span className="admin-stat-hint">{renderMetric(dashboard.users.total)} total platform users</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Published websites</span>
          <strong className="admin-stat-value">{renderMetric(dashboard.websites.published)}</strong>
          <span className="admin-stat-hint">{renderMetric(dashboard.websites.total)} websites tracked</span>
        </article>
      </div>

      <div className="admin-content-grid">
        <section className="admin-panel admin-panel-wide" aria-label="Deployment and platform overview">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Vercel overview</span>
              <h2>Deployment, analytics, and monitoring foundation</h2>
              <p>
                Server-side Vercel reads are used when configuration is available. Secrets are never exposed to the
                browser.
              </p>
            </div>
            <Link href={routes.adminDeployments} className="admin-inline-link">
              Open deployment details
            </Link>
          </header>

          <div className="admin-overview-grid">
            <article className="admin-surface-card">
              <span className="admin-surface-label">Deployment status</span>
              <strong>{latestDeployment ? latestDeployment.name : "Vercel integration is not configured yet."}</strong>
              <p>
                {latestDeployment
                  ? `${formatVercelState(latestDeployment.state)}${latestDeployment.branch ? ` on ${latestDeployment.branch}` : ""}`
                  : "Add server-side VERCEL_API_TOKEN and VERCEL_PROJECT_ID values to enable deployment reads."}
              </p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Website health</span>
              <strong>{dashboard.monitoring.systemStatus}</strong>
              <p>{dashboard.monitoring.alerts[0]?.detail ?? "Health details are not available yet."}</p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Traffic &amp; analytics</span>
              <strong>{vercel.analytics.available ? "Ready for analytics expansion" : "Analytics placeholder"}</strong>
              <p>{vercel.analytics.message}</p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Admin management</span>
              <strong>{renderMetric(dashboard.users.admins)} admin users</strong>
              <p>Grant access only to existing accounts through the protected admin users page.</p>
            </article>
          </div>

          {vercel.deployments.length > 0 ? (
            <div className="admin-list-shell">
              <div className="admin-list-heading">
                <h3>Recent builds and deployments</h3>
                <p>Latest deployment records returned from the configured Vercel project.</p>
              </div>
              <ul className="admin-list">
                {vercel.deployments.slice(0, 4).map((deployment) => (
                  <li key={deployment.id} className="admin-list-item">
                    <div>
                      <strong>{deployment.name}</strong>
                      <p>
                        {formatVercelState(deployment.state)}
                        {deployment.branch ? ` · ${deployment.branch}` : ""}
                        {deployment.commitSha ? ` · ${deployment.commitSha.slice(0, 7)}` : ""}
                      </p>
                    </div>
                    <div className="admin-list-meta">
                      <span>{formatAdminDate(deployment.createdAt)}</span>
                      {deployment.url ? (
                        <a href={deployment.url} target="_blank" rel="noreferrer" className="admin-inline-link">
                          Open
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="admin-empty-state">
              <strong>No deployment records available yet.</strong>
              <p>Once the Vercel project is connected, recent deployments will appear here.</p>
            </div>
          )}
        </section>

        <section className="admin-panel" aria-label="Environment and service status">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Status checks</span>
              <h2>Environment and service checks</h2>
              <p>Configuration and platform checks used to gate the admin integration foundation.</p>
            </div>
          </header>

          <ul className="admin-check-list">
            {vercel.checks.map((check) => (
              <li key={check.id} className={getCheckClass(check.status)}>
                <strong>{check.label}</strong>
                <span>{check.detail}</span>
              </li>
            ))}
          </ul>

          <div className="admin-list-shell">
            <div className="admin-list-heading">
              <h3>Storage and API status</h3>
              <p>Safe server-side status checks for services used by this platform.</p>
            </div>
            <ul className="admin-key-value-list">
              {serviceChecks.map((check) => (
                <li key={check.label}>
                  <span>{check.label}</span>
                  <strong>{check.value}</strong>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="admin-content-grid">
        <section className="admin-panel" aria-label="Recent platform activity">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Monitoring</span>
              <h2>Recent platform activity</h2>
              <p>Current platform events and alerts surfaced by existing server-side admin data.</p>
            </div>
          </header>

          {dashboard.monitoring.recentActivity.length > 0 ? (
            <ul className="admin-list">
              {dashboard.monitoring.recentActivity.map((activity) => (
                <li key={activity.id} className="admin-list-item">
                  <div>
                    <strong>{activity.title}</strong>
                    <p>{activity.detail}</p>
                  </div>
                  <span className="admin-list-meta">{formatAdminDate(activity.timestamp)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="admin-empty-state">
              <strong>No recent activity is available.</strong>
              <p>Activity cards will populate when publishing and scheduling events are present.</p>
            </div>
          )}
        </section>

        <section className="admin-panel" aria-label="Quick admin actions">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Admin actions</span>
              <h2>Jump to the protected admin tools</h2>
              <p>Use the dedicated admin routes for deployment visibility, analytics, and role management.</p>
            </div>
          </header>

          <div className="admin-action-grid">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="admin-action-card">
                <span>{link.kicker}</span>
                <strong>{link.label}</strong>
                <p>{link.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}

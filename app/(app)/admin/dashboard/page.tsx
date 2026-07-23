import Link from "next/link";
import { config, routes } from "@/config";
import { formatAdminDate, getAdminDashboardData } from "@/lib/admin/data";
import { formatVercelState, getVercelIntegrationOverview, type VercelIntegrationOverview } from "@/lib/admin/vercel";

export const dynamic = "force-dynamic";

const quickLinks = [
  {
    href: routes.adminDeployments,
    kicker: "Vercel",
    label: "View deployments",
    description: "Inspect recent builds, deployment state, and server-side Vercel setup status.",
  },
  {
    href: routes.adminAnalytics,
    kicker: "Counts",
    label: "Open analytics",
    description: "Review internal platform counts and external analytics readiness without fabricated traffic data.",
  },
  {
    href: routes.adminUsers,
    kicker: "Access",
    label: "Manage admin users",
    description: "Grant admin access to existing accounts using the protected server-side workflow.",
  },
];

function renderMetric(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function renderMetricValue(value: number, isAvailable: boolean): string {
  return isAvailable ? renderMetric(value) : "Unavailable";
}

function getCheckClass(status: string): string {
  if (status === "missing" || status === "unavailable") {
    return "admin-check admin-check-warning";
  }

  return "admin-check";
}

function getLatestDeploymentValue(vercel: VercelIntegrationOverview): string {
  if (vercel.latestDeployment) {
    return formatVercelState(vercel.latestDeployment.state);
  }

  if (vercel.status.connectionState === "missing") {
    return "Not configured";
  }

  if (vercel.status.connectionState === "error") {
    return "Unavailable";
  }

  return "No records yet";
}

function getDeploymentDetailsReason(vercel: VercelIntegrationOverview): string {
  if (vercel.latestDeployment) {
    return "The latest deployment did not include a public or inspect URL.";
  }

  if (vercel.status.connectionState === "missing") {
    return "Configure VERCEL_API_TOKEN and VERCEL_PROJECT_ID on the server to load deployment details.";
  }

  if (vercel.status.connectionState === "error") {
    return "Vercel is configured, but the deployment API response could not be loaded safely.";
  }

  return "No deployment records are available for the configured Vercel project yet.";
}

function renderActionLink(params: {
  href: string | null;
  label: string;
  variant?: "primary" | "secondary";
  reason?: string;
}): React.ReactNode {
  const className =
    params.variant === "secondary"
      ? "admin-page-action-link admin-page-action-link-secondary"
      : "admin-page-action-link";

  if (params.href) {
    return (
      <a href={params.href} target="_blank" rel="noreferrer" className={className}>
        {params.label}
      </a>
    );
  }

  return (
    <span className={`${className} admin-page-action-link-disabled`} aria-disabled="true" title={params.reason}>
      {params.label}
    </span>
  );
}

export default async function AdminDashboardPage() {
  const [dashboard, vercel] = await Promise.all([getAdminDashboardData(), getVercelIntegrationOverview()]);
  const latestDeployment = vercel.latestDeployment;
  const deploymentDetailsReason = getDeploymentDetailsReason(vercel);
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
            Counts below come from <code>public.profiles</code>, <code>public.website_structures</code>, and{" "}
            <code>public.website_versions</code>. External deployment data is shown only when the server-side Vercel
            integration is configured.
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
          <strong className="admin-stat-value">{getLatestDeploymentValue(vercel)}</strong>
          <span className="admin-stat-hint">
            {latestDeployment ? `Created ${formatAdminDate(latestDeployment.createdAt)}` : vercel.status.message}
          </span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Platform health</span>
          <strong className="admin-stat-value">
            {dashboard.monitoring.isAvailable ? dashboard.monitoring.systemStatus : "Unavailable"}
          </strong>
          <span className="admin-stat-hint">
            {dashboard.monitoring.isAvailable
              ? `${renderMetric(dashboard.monitoring.failedJobs)} tracked failed jobs or retries`
              : dashboard.monitoring.alerts[0]?.detail ?? "Monitoring data is unavailable."}
          </span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Admin accounts</span>
          <strong className="admin-stat-value">{renderMetricValue(dashboard.users.admins, dashboard.users.isAvailable)}</strong>
          <span className="admin-stat-hint">
            {dashboard.users.isAvailable
              ? `${renderMetric(dashboard.users.standard)} standard users from public.profiles`
              : "Profile counts are unavailable right now."}
          </span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Live websites</span>
          <strong className="admin-stat-value">{renderMetricValue(dashboard.websites.live, dashboard.websites.isAvailable)}</strong>
          <span className="admin-stat-hint">
            {dashboard.websites.isAvailable
              ? `${renderMetric(dashboard.websites.total)} generated / ${renderMetric(dashboard.websites.drafts)} draft / ${renderMetric(dashboard.websites.archived)} archived`
              : "Website counts are unavailable right now."}
          </span>
        </article>
      </div>

      <div className="admin-content-grid">
        <section className="admin-panel admin-panel-wide" aria-label="Deployment and platform overview">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Vercel overview</span>
              <h2>Deployment, website inventory, and analytics readiness</h2>
              <p>
                Deployment reads stay server-side. Traffic analytics are not shown unless a real external source is
                wired in.
              </p>
            </div>
            <div className="admin-link-row">
              <Link href={routes.adminDeployments} className="admin-inline-link">
                View deployments
              </Link>
              {renderActionLink({
                href: vercel.deploymentDetailsHref,
                label: "Open deployment details",
                variant: "secondary",
                reason: deploymentDetailsReason,
              })}
            </div>
          </header>

          {!vercel.deploymentDetailsHref ? <p className="admin-action-note">{deploymentDetailsReason}</p> : null}

          <div className="admin-overview-grid">
            <article className="admin-surface-card">
              <span className="admin-surface-label">Deployment status</span>
              <strong>{latestDeployment ? latestDeployment.name : getLatestDeploymentValue(vercel)}</strong>
              <p>
                {latestDeployment
                  ? `${formatVercelState(latestDeployment.state)}${latestDeployment.branch ? ` on ${latestDeployment.branch}` : ""}`
                  : vercel.status.message}
              </p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Website inventory</span>
              <strong>
                {dashboard.websites.isAvailable
                  ? `${renderMetric(dashboard.websites.total)} generated website records`
                  : "Website inventory unavailable"}
              </strong>
              <p>
                {dashboard.websites.isAvailable
                  ? `${renderMetric(dashboard.websites.live)} live / ${renderMetric(dashboard.websites.drafts)} draft / ${renderMetric(dashboard.websites.archived)} archived from website_structures.`
                  : "Website counts could not be loaded from website_structures."}
              </p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Traffic analytics</span>
              <strong>{vercel.analytics.statusLabel}</strong>
              <p>{vercel.analytics.message}</p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Admin management</span>
              <strong>
                {dashboard.users.isAvailable
                  ? `${renderMetric(dashboard.users.admins)} admin users`
                  : "Profile counts unavailable"}
              </strong>
              <p>
                {dashboard.users.isAvailable
                  ? `Counts are read from public.profiles. ${renderMetric(dashboard.users.standard)} standard users are currently tracked.`
                  : "Admin and user counts could not be loaded from public.profiles."}
              </p>
            </article>
          </div>

          {vercel.deployments.length > 0 ? (
            <div className="admin-list-shell">
              <div className="admin-list-heading">
                <h3>Recent builds and deployments</h3>
                <p>Latest deployment records returned from the configured Vercel project.</p>
              </div>
              <ul className="admin-list">
                {vercel.deployments.slice(0, 4).map((deployment) => {
                  const deploymentHref = deployment.inspectUrl ?? deployment.url;

                  return (
                    <li key={deployment.id} className="admin-list-item">
                      <div>
                        <strong>{deployment.name}</strong>
                        <p>
                          {formatVercelState(deployment.state)}
                          {deployment.branch ? ` / ${deployment.branch}` : ""}
                          {deployment.commitSha ? ` / ${deployment.commitSha.slice(0, 7)}` : ""}
                        </p>
                      </div>
                      <div className="admin-list-meta">
                        <span>{formatAdminDate(deployment.createdAt)}</span>
                        {deploymentHref ? (
                          <a href={deploymentHref} target="_blank" rel="noreferrer" className="admin-inline-link">
                            Open
                          </a>
                        ) : (
                          <span className="admin-inline-link admin-page-action-link-disabled" aria-disabled="true">
                            Open
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <div className="admin-empty-state">
              <strong>No deployment records available.</strong>
              <p>
                {vercel.status.connectionState === "missing"
                  ? "Connect the server-side Vercel integration to load recent deployments here."
                  : vercel.status.connectionState === "error"
                    ? "Deployment reads failed safely. Verify the Vercel token, project ID, and optional team ID."
                    : "The configured project did not return any deployment records yet."}
              </p>
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
              <p>Recent website, publishing, and scheduling updates derived from existing server-side records.</p>
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
              <p>Recent activity will appear when website, publishing, or scheduling records are updated.</p>
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

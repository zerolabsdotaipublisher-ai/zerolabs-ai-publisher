import Link from "next/link";
import { AdminActionLink } from "@/components/admin/admin-action-link";
import { AdminDiagnostics } from "@/components/admin/admin-diagnostics";
import { config, routes } from "@/config";
import { buildAdminAnalyticsModel, formatAdminDate, formatAdminDateTime, getAdminDashboardData } from "@/lib/admin/data";
import {
  formatVercelDuration,
  formatVercelState,
  getVercelIntegrationOverview,
  type VercelIntegrationOverview,
  type VercelLogEntrySummary,
} from "@/lib/admin/vercel";

export const dynamic = "force-dynamic";

const quickLinks = [
  {
    href: routes.adminDeployments,
    kicker: "Vercel",
    label: "View deployments",
    description: "Inspect recent builds, deployment events, and server-side Vercel setup status.",
  },
  {
    href: routes.adminAnalytics,
    kicker: "Counts",
    label: "Open analytics",
    description: "Review real internal platform counts and the current external analytics availability state.",
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

function renderNullableMetricValue(value: number | null, isAvailable: boolean, emptyLabel = "Not returned"): string {
  if (!isAvailable) {
    return "Unavailable";
  }

  if (value === null) {
    return emptyLabel;
  }

  return renderMetric(value);
}

function formatDeploymentUrl(value: string | null | undefined): string {
  if (!value) {
    return "Unavailable";
  }

  try {
    const parsedUrl = new URL(value);
    const pathname = parsedUrl.pathname === "/" ? "" : parsedUrl.pathname;
    return `${parsedUrl.hostname}${pathname}`;
  } catch {
    return value;
  }
}

function getCheckClass(status: string): string {
  if (status === "missing" || status === "unavailable") {
    return "admin-check admin-check-warning";
  }

  return "admin-check";
}

function getLogBadgeClass(level: VercelLogEntrySummary["level"]): string {
  if (level === "error") {
    return "admin-badge admin-badge-error";
  }

  if (level === "warning") {
    return "admin-badge admin-badge-warning";
  }

  return "admin-badge";
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
    return "Vercel did not return a deployment dashboard detail URL for the latest deployment.";
  }

  if (vercel.status.connectionState === "missing") {
    return "Configure VERCEL_API_TOKEN and VERCEL_PROJECT_ID on the server to load deployment details.";
  }

  if (vercel.status.connectionState === "error") {
    return "Vercel is configured, but the deployment API response could not be loaded safely.";
  }

  return "No deployment records are available for the configured Vercel project yet.";
}

function getDeploymentUrlReason(vercel: VercelIntegrationOverview): string {
  if (vercel.latestDeployment) {
    return "Vercel did not return a public deployment URL for the latest deployment.";
  }

  if (vercel.status.connectionState === "missing") {
    return "Configure the Vercel integration on the server to load the deployment URL.";
  }

  if (vercel.status.connectionState === "error") {
    return "The latest deployment could not be loaded safely.";
  }

  return "No deployment records are available for the configured Vercel project yet.";
}

export default async function AdminDashboardPage() {
  const [dashboard, vercel] = await Promise.all([getAdminDashboardData(), getVercelIntegrationOverview()]);
  const analytics = buildAdminAnalyticsModel({ dashboard, vercel });
  const latestDeployment = vercel.latestDeployment;
  const deploymentDetailsReason = getDeploymentDetailsReason(vercel);
  const deploymentUrlReason = getDeploymentUrlReason(vercel);
  const noVercelDataYet = analytics.vercel.diagnosticCodes.includes("no-data-yet");
  const vercelMetricsReachable = analytics.vercel.available || noVercelDataYet;
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
            <code>public.website_versions</code>. External Vercel data is shown only when the server-side integration
            returns it safely.
          </p>
        </div>
        <div className="admin-page-actions">
          <AdminActionLink href={routes.adminDeployments} label="View deployments" target="internal" />
          <AdminActionLink
            href={routes.adminUsers}
            label="Manage admin users"
            target="internal"
            variant="secondary"
          />
        </div>
      </header>

      <div className="admin-stat-grid" aria-label="Admin dashboard summary cards">
        <article className="admin-stat-card">
          <span className="admin-stat-label">Latest deployment</span>
          <strong className="admin-stat-value">{getLatestDeploymentValue(vercel)}</strong>
          <span className="admin-stat-hint">
            {latestDeployment
              ? `${latestDeployment.target ? `${formatVercelState(latestDeployment.target)} / ` : ""}${latestDeployment.branch ? `${latestDeployment.branch} / ` : ""}${formatAdminDateTime(latestDeployment.createdAt)} / ${formatVercelDuration(latestDeployment.buildDurationMs)}`
              : vercel.status.message}
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
          <span className="admin-stat-label">Vercel traffic (30 days)</span>
          <strong className="admin-stat-value">
            {renderNullableMetricValue(analytics.vercel.visitsLast30Days, vercelMetricsReachable, noVercelDataYet ? "No data" : "Not returned")}
          </strong>
          <span className="admin-stat-hint">
            {analytics.vercel.visitorsLast30Days !== null
              ? `${renderMetric(analytics.vercel.visitorsLast30Days)} visitors`
              : analytics.vercel.message}
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

      <div className="admin-dashboard-primary-grid">
        <section className="admin-panel" aria-label="Deployment and platform overview">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Vercel overview</span>
              <h2>Real deployment data with honest analytics and logs states</h2>
              <p>
                Deployment reads stay server-side. Traffic analytics and build-event summaries only show real Vercel
                data or an explicit unavailable state.
              </p>
            </div>
            <div className="admin-link-row">
              <AdminActionLink
                href={vercel.deploymentDetailsHref}
                label="Open deployment details"
                variant="secondary"
                reason={deploymentDetailsReason}
              />
              <AdminActionLink
                href={latestDeployment?.url ?? null}
                label="Open deployment URL"
                reason={deploymentUrlReason}
              />
            </div>
          </header>

          {!vercel.deploymentDetailsHref ? <p className="admin-action-note">{deploymentDetailsReason}</p> : null}

          <div className="admin-overview-grid">
            <article className="admin-surface-card">
              <span className="admin-surface-label">Deployment status</span>
              <strong>{latestDeployment ? formatVercelState(latestDeployment.state) : getLatestDeploymentValue(vercel)}</strong>
              <p>
                {latestDeployment
                  ? `${latestDeployment.name}${latestDeployment.target ? ` / ${formatVercelState(latestDeployment.target)}` : ""}${latestDeployment.branch ? ` / ${latestDeployment.branch}` : ""}`
                  : vercel.status.message}
              </p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Environment and branch</span>
              <strong>
                {latestDeployment?.target ? formatVercelState(latestDeployment.target) : "Environment unavailable"}
              </strong>
              <p>
                {latestDeployment
                  ? `${latestDeployment.branch ?? "Branch unavailable"} / ${formatAdminDateTime(latestDeployment.createdAt)}`
                  : "Deployment metadata is unavailable."}
              </p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Commit and creator</span>
              <strong>{latestDeployment?.commitSha?.slice(0, 12) ?? "Unavailable"}</strong>
              <p>
                {latestDeployment
                  ? `${latestDeployment.creator ?? "Creator unavailable"} / ${formatVercelDuration(latestDeployment.buildDurationMs)}`
                  : "Deployment metadata is unavailable."}
              </p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Deployment URL</span>
              <strong>{formatDeploymentUrl(latestDeployment?.url)}</strong>
              <p>
                {latestDeployment?.inspectUrl
                  ? "Vercel dashboard details are available for this deployment."
                  : getDeploymentUrlReason(vercel)}
              </p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Traffic analytics</span>
              <strong>
                {analytics.vercel.hasAnyTrafficData
                  ? renderNullableMetricValue(analytics.vercel.visitsLast30Days, true)
                  : analytics.vercel.statusLabel}
              </strong>
              <p>
                {analytics.vercel.hasAnyTrafficData
                  ? analytics.vercel.visitorsLast30Days !== null
                    ? `${renderMetric(analytics.vercel.visitorsLast30Days)} visitors in the last 30 days.`
                    : "Real Vercel Web Analytics totals are available for the last 30 days."
                  : analytics.vercel.actionItems[0] ?? analytics.vercel.message}
              </p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Build events</span>
              <strong>{vercel.logs.statusLabel}</strong>
              <p>{vercel.logs.message}</p>
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
                  ? `${renderMetric(dashboard.websites.live)} live / ${renderMetric(dashboard.websites.drafts)} draft / ${renderMetric(dashboard.websites.archived)} archived`
                  : "Website counts could not be loaded from website_structures."}
              </p>
            </article>
          </div>

          {vercel.deployments.length > 0 ? (
            <div className="admin-list-shell">
              <div className="admin-list-heading">
                <h3>Recent deployments</h3>
                <p>Latest deployment records returned from the configured Vercel project.</p>
              </div>
              <ul className="admin-list">
                {vercel.deployments.slice(0, 4).map((deployment) => (
                  <li key={deployment.id} className="admin-list-item">
                    <div>
                      <strong>{deployment.name}</strong>
                      <p>
                        {formatVercelState(deployment.state)}
                        {deployment.target ? ` / ${formatVercelState(deployment.target)}` : ""}
                        {deployment.branch ? ` / ${deployment.branch}` : ""}
                        {deployment.commitSha ? ` / ${deployment.commitSha.slice(0, 7)}` : ""}
                        {deployment.buildDurationMs !== null ? ` / ${formatVercelDuration(deployment.buildDurationMs)}` : ""}
                      </p>
                    </div>
                    <div className="admin-list-meta">
                      <span>{formatAdminDateTime(deployment.createdAt)}</span>
                      <div className="admin-list-actions">
                        <AdminActionLink
                          href={deployment.inspectUrl}
                          label="Details"
                          variant="secondary"
                          reason="Vercel did not return a deployment dashboard detail URL for this record."
                          showReasonWhenDisabled
                        />
                        <AdminActionLink
                          href={deployment.url}
                          label="Open URL"
                          reason="Vercel did not return a public deployment URL for this record."
                          showReasonWhenDisabled
                        />
                      </div>
                    </div>
                  </li>
                ))}
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

          <div className="admin-list-shell">
            <div className="admin-list-heading">
              <h3>Recent deployment event summary</h3>
              <p>Safe build-event lines from Vercel when available. Runtime logs still stay in Vercel or Log Drains.</p>
            </div>

            {vercel.logs.entries.length > 0 ? (
              <ul className="admin-list">
                {vercel.logs.entries.map((entry) => (
                  <li key={entry.id} className="admin-list-item">
                    <div>
                      <strong>{entry.message}</strong>
                      <p>
                        {entry.source ? `${formatVercelState(entry.source)} / ` : ""}
                        {formatAdminDateTime(entry.createdAt)}
                      </p>
                    </div>
                    <div className="admin-list-meta">
                      <span className={getLogBadgeClass(entry.level)}>{formatVercelState(entry.level)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="admin-empty-state">
                <strong>{vercel.logs.statusLabel}</strong>
                <p>{vercel.logs.message}</p>
                {vercel.logs.dashboardHref ? (
                  <div className="admin-empty-state-actions">
                    <AdminActionLink href={vercel.logs.dashboardHref} label="Open in Vercel" variant="secondary" />
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </section>

        <section className="admin-panel" aria-label="Environment and service status">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Status checks</span>
              <h2>Configuration and diagnostics</h2>
              <p>Safe configuration categories, environment checks, and honest availability diagnostics.</p>
            </div>
          </header>

          <AdminDiagnostics diagnostics={vercel.diagnostics} />

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

      <div className="admin-dashboard-secondary-grid">
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

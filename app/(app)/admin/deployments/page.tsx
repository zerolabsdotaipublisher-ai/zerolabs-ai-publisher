import { AdminActionLink } from "@/components/admin/admin-action-link";
import { AdminDiagnostics } from "@/components/admin/admin-diagnostics";
import { routes } from "@/config/routes";
import { formatAdminDateTime } from "@/lib/admin/data";
import {
  formatVercelDuration,
  formatVercelState,
  getVercelIntegrationOverview,
  type VercelIntegrationOverview,
  type VercelLogEntrySummary,
} from "@/lib/admin/vercel";

export const dynamic = "force-dynamic";

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

function getDeploymentBadgeClass(state: string): string {
  const normalizedState = state.toLowerCase();

  if (normalizedState.includes("error") || normalizedState.includes("failed") || normalizedState.includes("canceled")) {
    return "admin-badge admin-badge-error";
  }

  if (normalizedState.includes("building") || normalizedState.includes("queued") || normalizedState.includes("initializing")) {
    return "admin-badge admin-badge-warning";
  }

  return "admin-badge";
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

function getLatestDeploymentHeading(vercel: VercelIntegrationOverview): string {
  if (vercel.latestDeployment) {
    return vercel.latestDeployment.name;
  }

  if (vercel.status.connectionState === "missing") {
    return "Vercel integration not configured";
  }

  if (vercel.status.connectionState === "error") {
    return "Deployment data unavailable";
  }

  return "No deployment records returned";
}

function getDeploymentDetailsReason(vercel: VercelIntegrationOverview): string {
  if (vercel.latestDeployment) {
    return "Vercel did not return a deployment dashboard detail URL for the latest deployment.";
  }

  if (vercel.status.connectionState === "missing") {
    return "Configure VERCEL_API_TOKEN and VERCEL_PROJECT_ID on the server to load deployment details.";
  }

  if (vercel.status.connectionState === "error") {
    return "The Vercel API response could not be loaded safely. Verify token scope, project ID, and optional team ID.";
  }

  return "The configured project did not return any deployment records yet.";
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

  return "The configured project did not return any deployment records yet.";
}

export default async function AdminDeploymentsPage() {
  const vercel = await getVercelIntegrationOverview();
  const latestDeployment = vercel.latestDeployment;
  const latestDeploymentHref = latestDeployment?.inspectUrl ?? latestDeployment?.url ?? null;
  const latestDeploymentReason = getDeploymentDetailsReason(vercel);

  return (
    <section className="admin-page-shell" aria-label="Admin deployments page">
      <header className="admin-page-header">
        <div>
          <span className="admin-page-kicker">Vercel integration</span>
          <h1>Deployments</h1>
          <p>
            Deployment records and build-event summaries are fetched server-side only when the Vercel integration is
            configured. No API tokens are exposed to the browser.
          </p>
        </div>
      </header>

      <div className="admin-page-grid">
        <section className="admin-panel" aria-label="Latest deployment status">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Latest deployment</span>
              <h2>Current deployment status</h2>
              <p>Deployment name, environment, branch, commit, URL, and build timing from the configured Vercel project.</p>
            </div>
            <div className="admin-link-row">
              <AdminActionLink
                href={latestDeployment?.inspectUrl ?? null}
                label="Open deployment details"
                variant="secondary"
                reason={latestDeploymentReason}
              />
              <AdminActionLink
                href={latestDeployment?.url ?? null}
                label="Open deployment URL"
                reason={getDeploymentUrlReason(vercel)}
              />
            </div>
          </header>

          {!latestDeploymentHref ? <p className="admin-action-note">{latestDeploymentReason}</p> : null}

          {latestDeployment ? (
            <div className="admin-surface-card admin-surface-card-large">
              <div className="admin-surface-card-row">
                <div>
                  <span className="admin-surface-label">Deployment name</span>
                  <strong>{latestDeployment.name}</strong>
                </div>
                <span className={getDeploymentBadgeClass(latestDeployment.state)}>
                  {formatVercelState(latestDeployment.state)}
                </span>
              </div>
              <dl className="admin-detail-grid">
                <div>
                  <dt>Created</dt>
                  <dd>{formatAdminDateTime(latestDeployment.createdAt)}</dd>
                </div>
                <div>
                  <dt>Ready</dt>
                  <dd>{formatAdminDateTime(latestDeployment.readyAt)}</dd>
                </div>
                <div>
                  <dt>Environment</dt>
                  <dd>{latestDeployment.target ? formatVercelState(latestDeployment.target) : "Unavailable"}</dd>
                </div>
                <div>
                  <dt>Branch</dt>
                  <dd>{latestDeployment.branch ?? "Unavailable"}</dd>
                </div>
                <div>
                  <dt>Commit</dt>
                  <dd>{latestDeployment.commitSha?.slice(0, 12) ?? "Unavailable"}</dd>
                </div>
                <div>
                  <dt>Creator</dt>
                  <dd>{latestDeployment.creator ?? "Unavailable"}</dd>
                </div>
                <div>
                  <dt>Build duration</dt>
                  <dd>{formatVercelDuration(latestDeployment.buildDurationMs)}</dd>
                </div>
                <div>
                  <dt>Deployment URL</dt>
                  <dd>{formatDeploymentUrl(latestDeployment.url)}</dd>
                </div>
                <div>
                  <dt>Dashboard details</dt>
                  <dd>{latestDeployment.inspectUrl ? "Available in Vercel" : "Unavailable"}</dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="admin-empty-state">
              <strong>{getLatestDeploymentHeading(vercel)}</strong>
              <p>{vercel.status.message}</p>
            </div>
          )}

          {vercel.deployments.length > 0 ? (
            <div className="admin-list-shell">
              <div className="admin-list-heading">
                <h3>Recent deployments</h3>
                <p>Recent deployment events returned from Vercel.</p>
              </div>
              <ul className="admin-list">
                {vercel.deployments.map((deployment) => (
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
          ) : null}

          <div className="admin-list-shell">
            <div className="admin-list-heading">
              <h3>Recent build-event summary</h3>
              <p>Safe build-event lines from Vercel when available.</p>
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

        <section className="admin-panel" aria-label="Deployment configuration status">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Configuration</span>
              <h2>Integration status</h2>
              <p>Safe server-side visibility into the Vercel configuration and diagnostics state.</p>
            </div>
          </header>

          <AdminDiagnostics diagnostics={vercel.diagnostics} />

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

          {vercel.project ? (
            <div className="admin-surface-card">
              <span className="admin-surface-label">Configured project</span>
              <strong>{vercel.project.name}</strong>
              <p>Production branch: {vercel.project.productionBranch ?? "Unavailable"}</p>
              <p>Framework: {vercel.project.framework ?? "Unavailable"}</p>
              <p>Node version: {vercel.project.nodeVersion ?? "Unavailable"}</p>
              <p>
                Analytics metadata:{" "}
                {vercel.project.analyticsEnabled || vercel.project.speedInsightsEnabled ? "reported by Vercel" : "not reported"}
              </p>
            </div>
          ) : (
            <div className="admin-empty-state">
              <strong>Setup guidance</strong>
              <p>
                Configure <code>VERCEL_API_TOKEN</code>, <code>VERCEL_PROJECT_ID</code>, and optionally{" "}
                <code>VERCEL_TEAM_ID</code> on the server. The legacy <code>PIPELINE_VERCEL_*</code> aliases also work.
              </p>
            </div>
          )}

          <div className="admin-link-row">
            <AdminActionLink
              href={routes.adminAnalytics}
              label="Open analytics readiness"
              target="internal"
              variant="secondary"
            />
          </div>
        </section>
      </div>
    </section>
  );
}

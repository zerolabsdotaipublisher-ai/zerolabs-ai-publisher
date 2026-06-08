import Link from "next/link";
import { routes } from "@/config/routes";
import { formatAdminDate } from "@/lib/admin/data";
import { formatVercelState, getVercelIntegrationOverview } from "@/lib/admin/vercel";

export const dynamic = "force-dynamic";

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

export default async function AdminDeploymentsPage() {
  const vercel = await getVercelIntegrationOverview();
  const latestDeployment = vercel.latestDeployment;

  return (
    <section className="admin-page-shell" aria-label="Admin deployments page">
      <header className="admin-page-header">
        <div>
          <span className="admin-page-kicker">Vercel integration</span>
          <h1>Deployments</h1>
          <p>
            Latest deployment records are fetched server-side only when the Vercel integration is configured. No API
            tokens are exposed to the browser.
          </p>
        </div>
      </header>

      <div className="admin-content-grid">
        <section className="admin-panel admin-panel-wide" aria-label="Latest deployment status">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Latest deployment</span>
              <h2>Current deployment status</h2>
              <p>Deployment name, URL, state, created date, branch, and commit details from the configured project.</p>
            </div>
          </header>

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
                  <dd>{formatAdminDate(latestDeployment.createdAt)}</dd>
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
                  <dt>Target</dt>
                  <dd>{latestDeployment.target ?? "Unavailable"}</dd>
                </div>
              </dl>
              <div className="admin-link-row">
                {latestDeployment.url ? (
                  <a href={latestDeployment.url} target="_blank" rel="noreferrer" className="admin-page-action-link">
                    Open deployment
                  </a>
                ) : null}
                {latestDeployment.inspectUrl ? (
                  <a
                    href={latestDeployment.inspectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="admin-page-action-link admin-page-action-link-secondary"
                  >
                    Inspect in Vercel
                  </a>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="admin-empty-state">
              <strong>Vercel integration is not configured yet.</strong>
              <p>
                Add <code>VERCEL_API_TOKEN</code> and <code>VERCEL_PROJECT_ID</code> on the server to load deployment
                details here.
              </p>
            </div>
          )}

          {vercel.deployments.length > 0 ? (
            <div className="admin-list-shell">
              <div className="admin-list-heading">
                <h3>Recent builds and deployments</h3>
                <p>Recent deployment events returned from Vercel.</p>
              </div>
              <ul className="admin-list">
                {vercel.deployments.map((deployment) => (
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
                      {deployment.inspectUrl ? (
                        <a href={deployment.inspectUrl} target="_blank" rel="noreferrer" className="admin-inline-link">
                          Inspect
                        </a>
                      ) : deployment.url ? (
                        <a href={deployment.url} target="_blank" rel="noreferrer" className="admin-inline-link">
                          Open
                        </a>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="admin-panel" aria-label="Deployment configuration status">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Configuration</span>
              <h2>Integration status</h2>
              <p>Safe server-side visibility into the Vercel configuration state.</p>
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
            <strong>Setup guidance</strong>
            <p>
              Configure <code>VERCEL_API_TOKEN</code>, <code>VERCEL_PROJECT_ID</code>, and optionally{" "}
              <code>VERCEL_TEAM_ID</code> on the server. The legacy <code>PIPELINE_VERCEL_*</code> aliases also work.
            </p>
          </div>

          <div className="admin-link-row">
            <Link href={routes.adminAnalytics} className="admin-page-action-link admin-page-action-link-secondary">
              Open analytics readiness
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}

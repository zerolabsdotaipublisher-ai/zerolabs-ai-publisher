import Link from "next/link";
import { routes } from "@/config/routes";
import { formatAdminDate } from "@/lib/admin/data";
import { formatVercelState, getVercelIntegrationOverview, type VercelIntegrationOverview } from "@/lib/admin/vercel";

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
    return "The latest deployment did not include a public or inspect URL.";
  }

  if (vercel.status.connectionState === "missing") {
    return "Configure VERCEL_API_TOKEN and VERCEL_PROJECT_ID on the server to load deployment details.";
  }

  if (vercel.status.connectionState === "error") {
    return "The Vercel API response could not be loaded safely. Verify token scope, project ID, and optional team ID.";
  }

  return "The configured project did not return any deployment records yet.";
}

function renderExternalAction(params: {
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
            Deployment records are fetched server-side only when the Vercel integration is configured. No API tokens
            are exposed to the browser.
          </p>
        </div>
      </header>

      <div className="admin-content-grid">
        <section className="admin-panel admin-panel-wide" aria-label="Latest deployment status">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Latest deployment</span>
              <h2>Current deployment status</h2>
              <p>Deployment name, URL, state, branch, and commit details from the configured Vercel project.</p>
            </div>
            <div className="admin-link-row">
              {renderExternalAction({
                href: latestDeployment?.url ?? null,
                label: "Open deployment",
              })}
              {renderExternalAction({
                href: latestDeployment?.inspectUrl ?? null,
                label: "Inspect in Vercel",
                variant: "secondary",
              })}
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
                <h3>Recent builds and deployments</h3>
                <p>Recent deployment events returned from Vercel.</p>
              </div>
              <ul className="admin-list">
                {vercel.deployments.map((deployment) => {
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

          {vercel.project ? (
            <div className="admin-surface-card">
              <span className="admin-surface-label">Configured project</span>
              <strong>{vercel.project.name}</strong>
              <p>Production branch: {vercel.project.productionBranch ?? "Unavailable"}</p>
              <p>Framework: {vercel.project.framework ?? "Unavailable"}</p>
              <p>Node version: {vercel.project.nodeVersion ?? "Unavailable"}</p>
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
            <Link href={routes.adminAnalytics} className="admin-page-action-link admin-page-action-link-secondary">
              Open analytics readiness
            </Link>
          </div>
        </section>
      </div>
    </section>
  );
}

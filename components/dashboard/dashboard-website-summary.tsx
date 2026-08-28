import Link from "next/link";
import { PublishStatusBadge } from "@/components/publish/publish-status-badge";
import { routes } from "@/config/routes";
import type { DashboardWebsiteSummary } from "@/lib/dashboard";

interface DashboardWebsiteSummaryProps {
  summary: DashboardWebsiteSummary;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString();
}

function formatMetric(value: number | null, emptyLabel = "Unavailable"): string {
  return value === null ? emptyLabel : value.toLocaleString();
}

function formatDataSourceLabel(value: DashboardWebsiteSummary["dataSource"]): string {
  switch (value) {
    case "website_projects":
      return "Using normalized website project rows.";
    case "hybrid":
      return "Using website projects with structure fallback.";
    default:
      return "Using website structure records.";
  }
}

export function DashboardWebsiteSummarySection({ summary }: DashboardWebsiteSummaryProps) {
  return (
    <section className="dashboard-panel-shell dashboard-website-section" aria-label="Generated websites">
      <header className="dashboard-section-heading">
        <div>
          <h2>Generated websites</h2>
          <p>Review website status, visibility, page counts, and existing preview or edit routes from the main dashboard.</p>
        </div>

        <div className="dashboard-panel-actions">
          <Link href={routes.generateWebsite} className="dashboard-inline-link">
            Generate website
          </Link>
          <Link href={routes.websites} className="dashboard-inline-link">
            Manage all websites
          </Link>
        </div>
      </header>

      <dl className="dashboard-website-overview">
        <div className="dashboard-website-overview-item">
          <dt>Generated websites</dt>
          <dd>{summary.total.toLocaleString()}</dd>
        </div>
        <div className="dashboard-website-overview-item">
          <dt>Draft websites</dt>
          <dd>{summary.draft.toLocaleString()}</dd>
        </div>
        <div className="dashboard-website-overview-item">
          <dt>Published websites</dt>
          <dd>{summary.published.toLocaleString()}</dd>
        </div>
        <div className="dashboard-website-overview-item">
          <dt>Stored pages</dt>
          <dd>{formatMetric(summary.storedPages)}</dd>
        </div>
        <div className="dashboard-website-overview-item">
          <dt>Stored versions</dt>
          <dd>{formatMetric(summary.storedVersions)}</dd>
        </div>
      </dl>

      {summary.generatedWebsites.length === 0 ? (
        <div className="dashboard-website-empty">
          <strong>No websites yet. Generate your first website.</strong>
          <p>Your dashboard will show preview-ready website cards here as soon as you create one.</p>
          <Link href={routes.generateWebsite} className="dashboard-website-button is-primary">
            Generate Website
          </Link>
        </div>
      ) : (
        <div className="dashboard-website-grid">
          {summary.generatedWebsites.map((website) => (
            <article key={website.id} className="dashboard-website-card">
              <div className="dashboard-website-card-header">
                <div className="dashboard-website-card-copy">
                  {website.generatedSitePath ? (
                    <Link href={website.generatedSitePath} className="dashboard-website-title">
                      {website.title}
                    </Link>
                  ) : (
                    <strong className="dashboard-website-title">{website.title}</strong>
                  )}
                  <p>
                    Created {formatDate(website.createdAt)}
                    {website.updatedAt ? ` | Updated ${formatDate(website.updatedAt)}` : ""}
                  </p>
                </div>

                <div className="dashboard-website-pill-row">
                  <PublishStatusBadge state={website.status} />
                  <span className={`dashboard-website-visibility is-${website.visibility ?? "private"}`}>
                    {website.visibility ?? "private"}
                  </span>
                </div>
              </div>

              <dl className="dashboard-website-details">
                <div>
                  <dt>Status</dt>
                  <dd>{website.statusLabel}</dd>
                </div>
                <div>
                  <dt>Visibility</dt>
                  <dd>{website.visibility ?? "private"}</dd>
                </div>
                <div>
                  <dt>Pages</dt>
                  <dd>{website.pageCount ?? "Unavailable"}</dd>
                </div>
                <div>
                  <dt>Route</dt>
                  <dd>{website.previewPath ?? "Preview unavailable"}</dd>
                </div>
              </dl>

              <div className="dashboard-website-actions">
                {website.previewPath ? (
                  <Link href={website.previewPath} className="dashboard-website-button is-primary">
                    Preview
                  </Link>
                ) : null}
                {website.editorPath ? (
                  <Link href={website.editorPath} className="dashboard-website-button is-secondary">
                    Open / Edit
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="dashboard-section-footnote">{formatDataSourceLabel(summary.dataSource)}</p>
    </section>
  );
}

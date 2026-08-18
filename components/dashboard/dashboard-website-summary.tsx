import Link from "next/link";
import { routes } from "@/config/routes";
import type { DashboardWebsiteSummary } from "@/lib/dashboard";
import { PublishStatusBadge } from "@/components/publish/publish-status-badge";

interface DashboardWebsiteSummaryProps {
  summary: DashboardWebsiteSummary;
}

export function DashboardWebsiteSummarySection({ summary }: DashboardWebsiteSummaryProps) {
  return (
    <section className="dashboard-panel-shell" aria-label="Website summary">
      <header>
        <h2>Your websites</h2>
        <p>Recently generated and managed active websites.</p>
      </header>
      <dl className="dashboard-definition-grid">
        <div>
          <dt>Total</dt>
          <dd>{summary.total}</dd>
        </div>
        <div>
          <dt>Published</dt>
          <dd>{summary.published}</dd>
        </div>
        <div>
          <dt>Draft</dt>
          <dd>{summary.draft}</dd>
        </div>
        <div>
          <dt>Archived</dt>
          <dd>{summary.archived}</dd>
        </div>
        <div>
          <dt>Needs attention</dt>
          <dd>{summary.attentionRequired}</dd>
        </div>
      </dl>
      {summary.recentlyUpdated.length > 0 ? (
        <ul className="dashboard-compact-list">
          {summary.recentlyUpdated.map((website) => (
            <li key={website.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                  <Link href={website.href} className="dashboard-inline-link" style={{ fontSize: "1.1rem", marginBottom: "0.25rem", display: "inline-block" }}>
                    {website.title}
                  </Link>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    <PublishStatusBadge state={website.publishStatus.uiState} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                    <time dateTime={website.updatedAt}>Updated: {new Date(website.updatedAt).toLocaleString()}</time>
                    <span>
                      Published:{" "}
                      {website.publishedAt ? new Date(website.publishedAt).toLocaleString() : "Not published"}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                  <Link href={website.previewPath} className="wizard-button-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", minHeight: "auto" }}>
                    Preview
                  </Link>
                  <Link href={website.editorPath} className="wizard-button-secondary" style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", minHeight: "auto" }}>
                    Open / Edit
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dashboard-empty-note">No websites found yet.</p>
      )}
      <Link href={routes.websites} className="dashboard-inline-link">Manage all websites</Link>
    </section>
  );
}

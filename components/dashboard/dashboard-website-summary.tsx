import Link from "next/link";
import { routes } from "@/config/routes";
import type { DashboardWebsiteSummary } from "@/lib/dashboard";

interface DashboardWebsiteSummaryProps {
  summary: DashboardWebsiteSummary;
}

export function DashboardWebsiteSummarySection({ summary }: DashboardWebsiteSummaryProps) {
  return (
    <section className="dashboard-panel-shell" aria-label="Website summary">
      <header>
        <h2>Website summary</h2>
        <p>Reused from existing website management lifecycle and status data.</p>
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
              <Link href={website.href}>{website.title}</Link>
              <span>{website.status}</span>
              <time dateTime={website.updatedAt}>{new Date(website.updatedAt).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="dashboard-empty-note">No websites found yet.</p>
      )}
      <Link href={routes.websites}>Manage all websites</Link>
    </section>
  );
}

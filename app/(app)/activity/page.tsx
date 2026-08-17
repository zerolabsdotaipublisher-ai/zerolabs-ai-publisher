import Link from "next/link";
import { routes } from "@/config/routes";
import { requireUser } from "@/lib/supabase/auth";
import { getUserPublishingActivityOverview } from "@/lib/activity/user-activity";

export const dynamic = "force-dynamic";

function renderMetric(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function renderMetricValue(value: number | null, isAvailable: boolean, emptyLabel = "Not returned"): string {
  if (!isAvailable) {
    return "Unavailable";
  }

  if (value === null) {
    return emptyLabel;
  }

  return renderMetric(value);
}

export default async function ActivityPage() {
  const user = await requireUser(routes.activity);
  const overview = await getUserPublishingActivityOverview(user.id);

  return (
    <section className="admin-shell" aria-label="Activity workspace">
      <div className="admin-main">
        <header className="admin-panel-header">
          <div>
            <span className="admin-panel-kicker">User dashboard</span>
            <h1>Activity</h1>
            <p>
              Review your recent website generation, publishing, and analytics readiness.
            </p>
          </div>
        </header>

        <section className="admin-panel" aria-label="Website summary">
          <div className="admin-list-shell">
            <div className="admin-list-heading">
              <h3>Website summary</h3>
              <p>Key metrics across your managed websites.</p>
            </div>
            <ul className="admin-key-value-list">
              <li>
                <span>Generated websites</span>
                <strong>{renderMetricValue(overview.totalWebsites, overview.isAvailable)}</strong>
              </li>
              <li>
                <span>Draft websites</span>
                <strong>{renderMetricValue(overview.draftWebsites, overview.isAvailable)}</strong>
              </li>
              <li>
                <span>Published websites</span>
                <strong>{renderMetricValue(overview.publishedWebsites, overview.isAvailable)}</strong>
              </li>
              <li>
                <span>Stored versions</span>
                <strong>Unavailable</strong>
              </li>
            </ul>
          </div>
        </section>

        <section className="admin-panel" aria-label="Analytics readiness">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Insights</span>
              <h2>Analytics readiness</h2>
              <p>Visitor and traffic analytics status.</p>
            </div>
          </header>

          <div className="admin-overview-grid">
            <article className="admin-surface-card">
              <span className="admin-surface-label">Analytics status</span>
              <strong>Not configured</strong>
              <p>Activity data is currently unavailable.</p>
            </article>
          </div>
        </section>

        <section className="admin-panel" aria-label="Your websites">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Websites</span>
              <h2>Website activity list</h2>
              <p>Recent changes and updates to your websites.</p>
            </div>
          </header>

          <div className="admin-list-shell">
            {overview.websites.length > 0 ? (
              <ul className="admin-list">
                {overview.websites.map((website) => (
                  <li key={website.id} className="admin-list-item">
                    <div>
                      <strong>{website.title || "Untitled Website"}</strong>
                      <p>
                        {website.status}
                        {website.lastUpdatedAt ? ` • Updated: ${new Date(website.lastUpdatedAt).toLocaleDateString()}` : ""}
                        {website.generatedAt ? ` • Created: ${new Date(website.generatedAt).toLocaleDateString()}` : ""}
                      </p>
                    </div>
                    <div className="admin-list-meta">
                      <Link href={routes.editorSite(website.id)} className="dashboard-action-button dashboard-action-button-secondary">
                        Edit
                      </Link>
                      <Link href={routes.previewSite(website.id)} className="dashboard-action-button dashboard-action-button-secondary">
                        Preview
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="admin-empty-state">
                <strong>No websites found.</strong>
                <p>You haven&apos;t generated any websites yet.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </section>
  );
}

import { routes } from "@/config/routes";
import { formatAdminDate, getAdminDashboardData, listAdminWebsites } from "@/lib/admin/data";
import { requireAdminUser } from "@/lib/supabase/auth";

function renderMetric(value: number | null, emptyLabel = "No data yet"): string {
  return value === null ? emptyLabel : String(value);
}

export default async function AdminWebsitesPage() {
  await requireAdminUser(routes.adminWebsites);

  const [dashboard, websites] = await Promise.all([getAdminDashboardData(), listAdminWebsites(24)]);

  return (
    <section className="dashboard-home-shell" aria-label="Admin websites page">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs operations</span>
          <h1>Admin Websites</h1>
          <p>Review websites created across the platform, including owner email visibility, creation dates, and current lifecycle status.</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Admin websites summary">
          <span className="dashboard-welcome-label">Website summary</span>
          <strong>{renderMetric(dashboard.websites.total)} created websites</strong>
          <p>{renderMetric(dashboard.websites.published)} published · {renderMetric(dashboard.websites.drafts)} drafts</p>
        </aside>
      </header>

      <section className="dashboard-panel-shell" aria-label="Admin website records">
        <header className="dashboard-section-heading">
          <div>
            <h2>Website directory</h2>
            <p>Safe management view of website records. When website data is unavailable, the page stays stable and shows an empty state.</p>
          </div>
        </header>

        {websites.length > 0 ? (
          <ul className="dashboard-compact-list">
            {websites.map((website) => (
              <li key={website.id}>
                <strong>{website.title}</strong>
                <span>{website.websiteType} · {website.status} · {website.ownerEmail}</span>
                <span>Created {formatAdminDate(website.createdAt)} · Updated {formatAdminDate(website.updatedAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dashboard-empty-note">No website records yet.</p>
        )}
      </section>
    </section>
  );
}

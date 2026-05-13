import { routes } from "@/config/routes";
import { formatAdminDate, getAdminDashboardData, listAdminUsers } from "@/lib/admin/data";
import { requireAdminUser } from "@/lib/supabase/auth";

function renderMetric(value: number | null, emptyLabel = "No data yet"): string {
  return value === null ? emptyLabel : String(value);
}

export default async function AdminUsersPage() {
  await requireAdminUser(routes.adminUsers);

  const [dashboard, users] = await Promise.all([getAdminDashboardData(), listAdminUsers(24)]);

  return (
    <section className="dashboard-home-shell" aria-label="Admin users page">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs operations</span>
          <h1>Admin Users</h1>
          <p>Review account email addresses, server-authoritative roles, signup dates, and basic auth status without exposing browser-side admin privileges.</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Admin users summary">
          <span className="dashboard-welcome-label">User summary</span>
          <strong>{renderMetric(dashboard.users.total)} total users</strong>
          <p>{renderMetric(dashboard.users.admins)} admin account{dashboard.users.admins === 1 ? "" : dashboard.users.admins === null ? "(s)" : "s"} · {renderMetric(dashboard.users.recentSignups)} recent signups</p>
        </aside>
      </header>

      <section className="dashboard-panel-shell" aria-label="Admin user records">
        <header className="dashboard-section-heading">
          <div>
            <h2>User directory</h2>
            <p>Stable admin listing with profile role data and basic auth state. Empty states are safe when no user data is available yet.</p>
          </div>
        </header>

        {users.length > 0 ? (
          <ul className="dashboard-compact-list">
            {users.map((record) => (
              <li key={record.id}>
                <strong>{record.email}</strong>
                <span>{record.role} · {record.status}</span>
                <span>Created {formatAdminDate(record.createdAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dashboard-empty-note">No user records yet.</p>
        )}
      </section>
    </section>
  );
}

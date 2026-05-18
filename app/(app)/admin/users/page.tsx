import { AdminFallback } from "@/components/admin/admin-fallback";
import { routes } from "@/config/routes";
import { formatAdminDate, getAdminDashboardData, listAdminUsers } from "@/lib/admin/data";
import { logger } from "@/lib/observability";
import { requireAdminUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

function renderMetric(value: number | null, emptyLabel = "No data yet"): string {
  return value === null ? emptyLabel : String(value);
}

function renderAdminAccountLabel(count: number | null): string {
  if (count === 1) {
    return "admin account";
  }

  if (count === null) {
    return "admin account(s)";
  }

  return "admin accounts";
}

async function loadAdminUsersPage() {
  try {
    const { user, isAdmin } = await requireAdminUser(routes.adminUsers);

    if (!isAdmin) {
      return {
        ok: false as const,
        userEmail: user.email,
        retryHref: routes.adminUsers,
        description: "Admin user data is temporarily unavailable, so the safe fallback view is being shown.",
      };
    }

    const [dashboard, users] = await Promise.all([getAdminDashboardData(), listAdminUsers(24)]);

    return {
      ok: true as const,
      dashboard,
      users,
    };
  } catch (error) {
    logger.error("AdminUsersPage fell back to admin fallback UI", {
      category: "error",
      service: "dashboard",
      error: { message: error instanceof Error ? error.message : String(error), name: "AdminUsersRenderError" },
    });

    return {
      ok: false as const,
      retryHref: routes.adminUsers,
    };
  }
}

export default async function AdminUsersPage() {
  const result = await loadAdminUsersPage();

  if (!result.ok) {
    return <AdminFallback userEmail={result.userEmail} retryHref={result.retryHref} description={result.description} />;
  }

  const { dashboard, users } = result;

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
          <p>{renderMetric(dashboard.users.admins)} {renderAdminAccountLabel(dashboard.users.admins)} · {renderMetric(dashboard.users.recentSignups)} recent signups</p>
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

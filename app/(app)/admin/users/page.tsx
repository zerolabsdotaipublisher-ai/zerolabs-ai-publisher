import { AdminFallback } from "@/components/admin/admin-fallback";
import { routes } from "@/config/routes";
import { formatAdminDate, getAdminDashboardData, listAdminUsers } from "@/lib/admin/data";
import { logger } from "@/lib/observability";
import { requireAdminUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

function renderMetric(value: number): string {
  return String(value);
}

function renderAdminAccountLabel(count: number): string {
  return count === 1 ? "admin account" : "admin accounts";
}

async function loadAdminUsersView() {
  try {
    const { user, isAdmin } = await requireAdminUser();

    if (!user || !isAdmin) {
      return {
        ok: false as const,
        userEmail: user?.email,
        title: "Admin access unavailable",
        description: "Admin access could not be confirmed for the users page, so a fallback view is being shown.",
        retryHref: routes.adminUsers,
      };
    }

    const [dashboard, users] = await Promise.all([getAdminDashboardData(), listAdminUsers(24)]);

    return {
      ok: true as const,
      dashboard,
      users,
    };
  } catch (error) {
    logger.error("AdminUsersPage fell back to AdminFallback", {
      category: "error",
      service: "dashboard",
      error: { message: error instanceof Error ? error.message : String(error), name: "AdminUsersRenderError" },
    });

    return {
      ok: false as const,
      title: "Admin users temporarily limited",
      description: "Admin user data could not be loaded safely, so a fallback view is being shown.",
      retryHref: routes.adminUsers,
    };
  }
}

export default async function AdminUsersPage() {
  const view = await loadAdminUsersView();

  if (!view.ok) {
    return (
      <AdminFallback
        userEmail={view.userEmail}
        title={view.title}
        description={view.description}
        retryHref={view.retryHref}
      />
    );
  }

  const { dashboard, users } = view;

  return (
    <section className="dashboard-home-shell" aria-label="Admin users page">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs operations</span>
          <h1>Admin Users</h1>
          <p>Review account email addresses, roles, signup dates, and basic auth status without any server-side redirects.</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Admin users summary">
          <span className="dashboard-welcome-label">User summary</span>
          <strong>{renderMetric(dashboard.users.total)} total users</strong>
          <p>
            {renderMetric(dashboard.users.admins)} {renderAdminAccountLabel(dashboard.users.admins)} · {renderMetric(dashboard.users.recentSignups)} recent signups
          </p>
        </aside>
      </header>

      <section className="dashboard-panel-shell" aria-label="Admin user records">
        <header className="dashboard-section-heading">
          <div>
            <h2>User directory</h2>
            <p>Stable admin listing with safe fallbacks when user data is unavailable.</p>
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
          <p className="dashboard-empty-note">No user records available.</p>
        )}
      </section>
    </section>
  );
}

import { AdminFallback } from "@/components/admin/admin-fallback";
import { routes } from "@/config/routes";
import { formatAdminDate, getAdminDashboardData, listAdminWebsites } from "@/lib/admin/data";
import { logger } from "@/lib/observability";
import { requireAdminUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

function renderMetric(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

async function loadAdminWebsitesView() {
  try {
    const { user, isAdmin } = await requireAdminUser();

    if (!user || !isAdmin) {
      return {
        ok: false as const,
        userEmail: user?.email,
        title: "Admin access unavailable",
        description: "Admin access could not be confirmed for the websites page, so a fallback view is being shown.",
        retryHref: routes.adminWebsites,
      };
    }

    const [dashboard, websites] = await Promise.all([getAdminDashboardData(), listAdminWebsites(24)]);

    return {
      ok: true as const,
      dashboard,
      websites,
    };
  } catch (error) {
    logger.error("AdminWebsitesPage fell back to AdminFallback", {
      category: "error",
      service: "dashboard",
      error: { message: error instanceof Error ? error.message : String(error), name: "AdminWebsitesRenderError" },
    });

    return {
      ok: false as const,
      title: "Admin websites temporarily limited",
      description: "Admin website data could not be loaded safely, so a fallback view is being shown.",
      retryHref: routes.adminWebsites,
    };
  }
}

export default async function AdminWebsitesPage() {
  const view = await loadAdminWebsitesView();

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

  const { dashboard, websites } = view;

  return (
    <section className="dashboard-home-shell" aria-label="Admin websites page">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs operations</span>
          <h1>Admin Websites</h1>
          <p>Review websites created across the platform, including owner email visibility and lifecycle status.</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Admin websites summary">
          <span className="dashboard-welcome-label">Website summary</span>
          <strong>{renderMetric(dashboard.websites.total)} generated website records</strong>
          <p>
            {renderMetric(dashboard.websites.live)} live / {renderMetric(dashboard.websites.drafts)} draft /{" "}
            {renderMetric(dashboard.websites.versions)} stored versions
          </p>
        </aside>
      </header>

      <section className="dashboard-panel-shell" aria-label="Admin website records">
        <header className="dashboard-section-heading">
          <div>
            <h2>Website directory</h2>
            <p>Safe website management view that remains stable even when data sources are unavailable.</p>
          </div>
        </header>

        {websites.length > 0 ? (
          <ul className="dashboard-compact-list">
            {websites.map((website) => (
              <li key={website.id}>
                <strong>{website.title}</strong>
                <span>{website.websiteType} / {website.status} / {website.ownerEmail}</span>
                <span>Created {formatAdminDate(website.createdAt)} / Updated {formatAdminDate(website.updatedAt)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="dashboard-empty-note">No website records available.</p>
        )}
      </section>
    </section>
  );
}

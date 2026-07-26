import { AdminActionLink } from "@/components/admin/admin-action-link";
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
    <section className="admin-page-shell" aria-label="Admin websites page">
      <header className="admin-page-header">
        <div>
          <span className="admin-page-kicker">Website operations</span>
          <h1>Admin Websites</h1>
          <p>Review existing platform website records, owner email visibility, publishing state, and live-url availability.</p>
        </div>
        <div className="admin-page-actions">
          <AdminActionLink href={routes.adminDashboard} label="Open dashboard" target="internal" variant="secondary" />
        </div>
      </header>

      <div className="admin-stat-grid" aria-label="Website summary cards">
        <article className="admin-stat-card">
          <span className="admin-stat-label">Generated websites</span>
          <strong className="admin-stat-value">{renderMetric(dashboard.websites.total)}</strong>
          <span className="admin-stat-hint">Current website_structures records tracked for admins</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Live websites</span>
          <strong className="admin-stat-value">{renderMetric(dashboard.websites.live)}</strong>
          <span className="admin-stat-hint">Website records currently published and reachable through a live state</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Draft websites</span>
          <strong className="admin-stat-value">{renderMetric(dashboard.websites.drafts)}</strong>
          <span className="admin-stat-hint">Draft, generated, edited, or scheduled website records</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Stored versions</span>
          <strong className="admin-stat-value">{renderMetric(dashboard.websites.versions)}</strong>
          <span className="admin-stat-hint">Total website_versions rows currently stored</span>
        </article>
      </div>

      <div className="admin-page-grid">
        <section className="admin-panel" aria-label="Admin website records">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Directory</span>
              <h2>Website directory</h2>
              <p>Safe website visibility for admins without changing website generation, preview rendering, or publication workflows.</p>
            </div>
          </header>

          {websites.length > 0 ? (
            <ul className="admin-list">
              {websites.map((website) => (
                <li key={website.id} className="admin-list-item">
                  <div>
                    <strong>{website.title}</strong>
                    <p>
                      {website.websiteType} / {website.status} / {website.ownerEmail}
                    </p>
                    <p>
                      Structure status: {website.structureStatus}
                      {website.lastPublishedAt ? ` / Last published ${formatAdminDate(website.lastPublishedAt)}` : ""}
                    </p>
                  </div>
                  <div className="admin-list-meta">
                    <span>Created {formatAdminDate(website.createdAt)} / Updated {formatAdminDate(website.updatedAt)}</span>
                    <div className="admin-list-actions">
                      <AdminActionLink
                        href={website.liveUrl}
                        label="Open live site"
                        reason="This website does not currently have a live URL."
                        showReasonWhenDisabled
                      />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="admin-empty-state">
              <strong>No website records available.</strong>
              <p>Website records will appear here after generation or import flows create them.</p>
            </div>
          )}
        </section>

        <section className="admin-panel" aria-label="Admin website summary">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Summary</span>
              <h2>Current inventory mix</h2>
              <p>These counts come from existing internal admin data and stay separate from deployment or analytics reads.</p>
            </div>
          </header>

          <div className="admin-overview-grid">
            <article className="admin-surface-card">
              <span className="admin-surface-label">Published</span>
              <strong>{renderMetric(dashboard.websites.live)}</strong>
              <p>Website records currently marked live.</p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Archived</span>
              <strong>{renderMetric(dashboard.websites.archived)}</strong>
              <p>Website records currently in an archived lifecycle state.</p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Deleted</span>
              <strong>{renderMetric(dashboard.websites.deleted)}</strong>
              <p>Website rows tracked as deleted or soft-deleted.</p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Live versions</span>
              <strong>{renderMetric(dashboard.websites.liveVersions)}</strong>
              <p>Version rows currently flagged as the live version.</p>
            </article>
          </div>

          <div className="admin-empty-state">
            <strong>Generation and rendering stay unchanged</strong>
            <p>This page is only a safer admin visibility layer. It does not alter website generation, preview rendering, or public site behavior.</p>
          </div>
        </section>
      </div>
    </section>
  );
}

import { AdminFallback } from "@/components/admin/admin-fallback";
import { routes } from "@/config/routes";
import { getAdminDashboardData } from "@/lib/admin/data";
import { logger } from "@/lib/observability";
import { requireAdminUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

function renderMetric(value: number): string {
  return String(value);
}

async function loadAdminAnalyticsView() {
  try {
    const { user, isAdmin } = await requireAdminUser();

    if (!user || !isAdmin) {
      return {
        ok: false as const,
        userEmail: user?.email,
        title: "Admin access unavailable",
        description: "Admin access could not be confirmed for the analytics page, so a fallback view is being shown.",
        retryHref: routes.adminAnalytics,
      };
    }

    const dashboard = await getAdminDashboardData();

    return {
      ok: true as const,
      dashboard,
    };
  } catch (error) {
    logger.error("AdminAnalyticsPage fell back to AdminFallback", {
      category: "error",
      service: "dashboard",
      error: { message: error instanceof Error ? error.message : String(error), name: "AdminAnalyticsRenderError" },
    });

    return {
      ok: false as const,
      title: "Admin analytics temporarily limited",
      description: "Admin analytics data could not be loaded safely, so a fallback view is being shown.",
      retryHref: routes.adminAnalytics,
    };
  }
}

export default async function AdminAnalyticsPage() {
  const view = await loadAdminAnalyticsView();

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

  const { dashboard } = view;

  return (
    <section className="dashboard-home-shell" aria-label="Admin analytics page">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs operations</span>
          <h1>Admin Analytics</h1>
          <p>Follow stable platform analytics focused on generation volume, publishing activity, and user growth.</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Admin analytics summary">
          <span className="dashboard-welcome-label">Analytics snapshot</span>
          <strong>{renderMetric(dashboard.analytics.websiteGenerationVolume)} recent generations</strong>
          <p>Safe stat-card analytics are shown even when live reporting is limited.</p>
        </aside>
      </header>

      <section className="dashboard-panel-shell" aria-label="Admin analytics metrics">
        <header className="dashboard-section-heading">
          <div>
            <h2>Analytics metrics</h2>
            <p>These cards rely on safe server-side fallbacks instead of unstable admin routing or redirects.</p>
          </div>
        </header>

        <div className="dashboard-metrics-grid">
          <article className="dashboard-metric-card">
            <span className="dashboard-metric-label">Website generation volume</span>
            <strong className="dashboard-metric-value">{renderMetric(dashboard.analytics.websiteGenerationVolume)}</strong>
            <span className="dashboard-metric-hint">Generated websites in the last 30 days</span>
          </article>
          <article className="dashboard-metric-card">
            <span className="dashboard-metric-label">Publishing activity</span>
            <strong className="dashboard-metric-value">{renderMetric(dashboard.analytics.publishingActivity)}</strong>
            <span className="dashboard-metric-hint">Published website records tracked by the platform</span>
          </article>
          <article className="dashboard-metric-card">
            <span className="dashboard-metric-label">User growth</span>
            <strong className="dashboard-metric-value">{renderMetric(dashboard.analytics.userGrowth)}</strong>
            <span className="dashboard-metric-hint">New accounts detected in the last 30 days</span>
          </article>
        </div>
      </section>
    </section>
  );
}

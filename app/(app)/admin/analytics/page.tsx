import { AdminFallback } from "@/components/admin/admin-fallback";
import { routes } from "@/config/routes";
import { getAdminDashboardData } from "@/lib/admin/data";
import { logger } from "@/lib/observability";
import { requireAdminUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

function renderMetric(value: number | null, emptyLabel = "No data yet"): string {
  return value === null ? emptyLabel : String(value);
}

async function loadAdminAnalyticsPage() {
  try {
    const { user, isAdmin } = await requireAdminUser(routes.adminAnalytics);

    if (!isAdmin) {
      return {
        ok: false as const,
        userEmail: user.email,
        retryHref: routes.adminAnalytics,
        description: "Admin analytics are temporarily unavailable, so the safe fallback view is being shown.",
      };
    }

    return {
      ok: true as const,
      dashboard: await getAdminDashboardData(),
    };
  } catch (error) {
    logger.error("AdminAnalyticsPage fell back to admin fallback UI", {
      category: "error",
      service: "dashboard",
      error: { message: error instanceof Error ? error.message : String(error), name: "AdminAnalyticsRenderError" },
    });

    return {
      ok: false as const,
      retryHref: routes.adminAnalytics,
    };
  }
}

export default async function AdminAnalyticsPage() {
  const result = await loadAdminAnalyticsPage();

  if (!result.ok) {
    return <AdminFallback userEmail={result.userEmail} retryHref={result.retryHref} description={result.description} />;
  }

  const { dashboard } = result;

  return (
    <section className="dashboard-home-shell" aria-label="Admin analytics page">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs operations</span>
          <h1>Admin Analytics</h1>
          <p>Follow stable platform analytics focused on website generation volume, publishing activity, and user growth placeholders.</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Admin analytics summary">
          <span className="dashboard-welcome-label">Analytics snapshot</span>
          <strong>{renderMetric(dashboard.analytics.websiteGenerationVolume)} recent generations</strong>
          <p>Safe stat-card analytics with “No data yet” fallbacks where live reporting is not available.</p>
        </aside>
      </header>

      <section className="dashboard-panel-shell" aria-label="Admin analytics metrics">
        <header className="dashboard-section-heading">
          <div>
            <h2>Analytics metrics</h2>
            <p>These cards intentionally avoid unstable dashboard summary logic and rely only on safe server-side queries.</p>
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

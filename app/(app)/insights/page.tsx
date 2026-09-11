import Link from "next/link";
import { ViewsChart } from "@/components/insights/views-chart";
import { routes } from "@/config/routes";
import { getInsightsSnapshot } from "@/lib/insights/storage";
import { requireUser } from "@/lib/supabase/auth";

function renderMetricValue(value: number | null): string {
  return value === null ? "Setup required" : value.toLocaleString();
}

export default async function InsightsPage() {
  const user = await requireUser(routes.insights);
  const insights = await getInsightsSnapshot(user.id);
  const { metrics, readiness, chart } = insights;

  return (
    <section className="dashboard-home-shell" aria-label="Insights workspace">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs insights</span>
          <h1>Insights</h1>
          <p>Website, profile, and community engagement counts are scoped to your account. Empty configured tables show zero; no data is fabricated.</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Insights overview">
          <span className="dashboard-welcome-label">Current readiness</span>
          <strong>{readiness.configuredMetricCount} of {readiness.totalMetricCount} metrics configured</strong>
          <p>
            {readiness.missingTables.length > 0
              ? `Setup required for: ${readiness.missingTables.join(", ")}.`
              : "All configured analytics sources are queried with owner-scoped access."}
          </p>
        </aside>
      </header>

      <ViewsChart chart={chart} />

      <section className="dashboard-panel-shell" aria-label="Insights metrics">
        <header className="dashboard-section-heading">
          <div>
            <h2>Analytics metrics</h2>
            <p>Counts are only shown when their backing table is available and can be queried safely.</p>
          </div>

          <div className="dashboard-panel-actions">
            <Link href={routes.dashboard} className="dashboard-inline-link">
              Open dashboard
            </Link>
            <Link href={routes.generateWebsite} className="dashboard-inline-link">
              Generate website
            </Link>
            <Link href={routes.feed} className="dashboard-inline-link">
              Open feed
            </Link>
          </div>
        </header>

        <div className="dashboard-metrics-grid">
          {metrics.map((metric) => (
            <article
              key={metric.id}
              className={`dashboard-metric-card${metric.value === null ? " dashboard-metric-card-warning" : ""}`}
            >
              <p className="dashboard-metric-label">{metric.title}</p>
              <p className={`dashboard-metric-value${metric.value === null ? " is-muted" : ""}`}>{renderMetricValue(metric.value)}</p>
              <p className="dashboard-metric-hint">{metric.description}</p>
              <p className="dashboard-section-footnote">Source: {metric.sourceTable}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

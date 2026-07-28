import { AdminActionLink } from "@/components/admin/admin-action-link";
import { AdminDiagnostics } from "@/components/admin/admin-diagnostics";
import { routes } from "@/config/routes";
import { buildAdminAnalyticsModel, getAdminDashboardData } from "@/lib/admin/data";
import { getVercelIntegrationOverview } from "@/lib/admin/vercel";

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

function renderPercent(value: number | null): string {
  if (value === null) {
    return "Share unavailable";
  }

  return `${(value * 100).toFixed(value >= 0.1 ? 0 : 1)}% of 30-day traffic`;
}

function renderBreakdownCard(params: {
  title: string;
  available: boolean;
  message: string;
  rows: Array<{ id: string; label: string; value: number; visitors: number | null; share: number | null }>;
}) {
  return (
    <article className="admin-surface-card">
      <span className="admin-surface-label">{params.title}</span>
      {params.available ? (
        <ul className="admin-list">
          {params.rows.map((row) => (
            <li key={row.id} className="admin-list-item">
              <div>
                <strong>{row.label}</strong>
                <p>
                  {renderPercent(row.share)}
                  {row.visitors !== null ? ` / ${renderMetric(row.visitors)} visitors` : ""}
                </p>
              </div>
              <div className="admin-list-meta">
                <strong>{renderMetric(row.value)}</strong>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>{params.message}</p>
      )}
    </article>
  );
}

export default async function AdminAnalyticsPage() {
  const [dashboard, vercel] = await Promise.all([getAdminDashboardData(), getVercelIntegrationOverview()]);
  const analytics = buildAdminAnalyticsModel({ dashboard, vercel });
  const internalMetricsAvailable = dashboard.analytics.internalMetricsAvailable;
  const analyticsDiagnostics = vercel.diagnostics.filter((diagnostic) => diagnostic.code !== "logs-unavailable");
  const analyticsChecks = vercel.checks.filter((check) => check.id !== "logs");
  const noVercelDataYet = analytics.vercel.diagnosticCodes.includes("no-data");
  const vercelMetricsReachable = analytics.vercel.available || noVercelDataYet;

  return (
    <section className="admin-page-shell" aria-label="Admin analytics page">
      <header className="admin-page-header">
        <div>
          <span className="admin-page-kicker">Analytics</span>
          <h1>Admin Analytics</h1>
          <p>
            Vercel Web Analytics traffic metrics are queried server-side only when available. Internal Supabase counts
            remain visible alongside an honest Vercel no-data, disabled, or access-limited state.
          </p>
        </div>
      </header>

      <div className="admin-stat-grid" aria-label="Analytics summary cards">
        <article className="admin-stat-card">
          <span className="admin-stat-label">Vercel visits / page views (7 days)</span>
          <strong className="admin-stat-value">
            {renderMetricValue(analytics.vercel.visitsLast7Days, vercelMetricsReachable, noVercelDataYet ? "No data" : "Not returned")}
          </strong>
          <span className="admin-stat-hint">{analytics.vercel.last7Days.label} summary from Vercel Web Analytics</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Vercel visits / page views (30 days)</span>
          <strong className="admin-stat-value">
            {renderMetricValue(analytics.vercel.visitsLast30Days, vercelMetricsReachable, noVercelDataYet ? "No data" : "Not returned")}
          </strong>
          <span className="admin-stat-hint">{analytics.vercel.last30Days.label} summary from Vercel Web Analytics</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Vercel visitors (30 days)</span>
          <strong className="admin-stat-value">
            {renderMetricValue(analytics.vercel.visitorsLast30Days, vercelMetricsReachable, noVercelDataYet ? "No data" : "Not returned")}
          </strong>
          <span className="admin-stat-hint">Shown only when Vercel returns a distinct visitors metric</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Generated websites</span>
          <strong className="admin-stat-value">
            {renderMetricValue(dashboard.analytics.generatedLast30Days, internalMetricsAvailable)}
          </strong>
          <span className="admin-stat-hint">Website records generated in the last 30 days</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Stored versions</span>
          <strong className="admin-stat-value">
            {renderMetricValue(dashboard.analytics.versionsStored, dashboard.websites.versionsAvailable)}
          </strong>
          <span className="admin-stat-hint">Total rows currently stored in website_versions</span>
        </article>
        <article className="admin-stat-card">
          <span className="admin-stat-label">Live websites</span>
          <strong className="admin-stat-value">
            {renderMetricValue(dashboard.websites.live, dashboard.websites.isAvailable)}
          </strong>
          <span className="admin-stat-hint">Website structure rows currently marked published</span>
        </article>
      </div>

      <div className="admin-page-grid">
        <section className="admin-panel" aria-label="Vercel Web Analytics">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Vercel Web Analytics</span>
              <h2>Real traffic metrics when Vercel returns them</h2>
              <p>
                The admin panel now queries Vercel Web Analytics server-side and only renders totals or grouped
                breakdowns that Vercel actually returned for the configured project.
              </p>
            </div>
            <div className="admin-link-row">
              <AdminActionLink href={routes.adminDeployments} label="View deployments" target="internal" variant="secondary" />
              <AdminActionLink
                href={analytics.vercel.dashboardHref}
                label="Open in Vercel"
                reason={analytics.vercel.message}
                showReasonWhenDisabled
              />
            </div>
          </header>

          <div className="admin-overview-grid">
            <article className="admin-surface-card">
              <span className="admin-surface-label">Analytics status</span>
              <strong>{analytics.vercel.statusLabel}</strong>
              <p>{analytics.vercel.message}</p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Last 7 days</span>
              <strong>
                {renderMetricValue(analytics.vercel.visitsLast7Days, vercelMetricsReachable, noVercelDataYet ? "No data" : "Not returned")}
              </strong>
              <p>
                {analytics.vercel.visitorsLast7Days !== null
                  ? `${renderMetric(analytics.vercel.visitorsLast7Days)} visitors`
                  : "Visitors metric not returned separately for this window."}
              </p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Last 30 days</span>
              <strong>
                {renderMetricValue(analytics.vercel.visitsLast30Days, vercelMetricsReachable, noVercelDataYet ? "No data" : "Not returned")}
              </strong>
              <p>
                {analytics.vercel.visitorsLast30Days !== null
                  ? `${renderMetric(analytics.vercel.visitorsLast30Days)} visitors`
                  : "Visitors metric not returned separately for this window."}
              </p>
            </article>
            <article className="admin-surface-card">
              <span className="admin-surface-label">Project metadata</span>
              <strong>{vercel.project?.analyticsEnabled ? "Web Analytics reported" : "Web Analytics not reported"}</strong>
              <p>Project metadata is informative only. Traffic values above are shown only when the live query returned data.</p>
            </article>
          </div>

          {analytics.vercel.hasAnyTrafficData ? (
            <div className="admin-list-shell">
              <div className="admin-list-heading">
                <h3>Daily traffic trend</h3>
                <p>Recent daily traffic buckets returned from Vercel for the last 7 days.</p>
              </div>
              {analytics.vercel.last7Days.daily.length > 0 ? (
                <ul className="admin-list">
                  {analytics.vercel.last7Days.daily.map((point) => (
                    <li key={point.id} className="admin-list-item">
                      <div>
                        <strong>{point.label}</strong>
                        <p>
                          {point.visitors !== null
                            ? `${renderMetric(point.visitors)} visitors`
                            : "Visitors metric not returned separately for this day."}
                        </p>
                      </div>
                      <div className="admin-list-meta">
                        <strong>{renderMetricValue(point.pageViews ?? point.visits, true)}</strong>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="admin-empty-state">
                  <strong>No daily trend returned.</strong>
                  <p>Vercel returned totals for this project, but no daily grouped rows were available for the last 7 days.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="admin-empty-state">
              <strong>{noVercelDataYet ? "No Vercel Web Analytics data available yet." : analytics.vercel.statusLabel}</strong>
              <p>{analytics.vercel.message}</p>
            </div>
          )}

          <div className="admin-overview-grid">
            {renderBreakdownCard({
              title: analytics.vercel.topPages.label,
              available: analytics.vercel.topPages.available,
              message: analytics.vercel.topPages.message,
              rows: analytics.vercel.topPages.rows,
            })}
            {renderBreakdownCard({
              title: analytics.vercel.referrers.label,
              available: analytics.vercel.referrers.available,
              message: analytics.vercel.referrers.message,
              rows: analytics.vercel.referrers.rows,
            })}
            {renderBreakdownCard({
              title: analytics.vercel.countries.label,
              available: analytics.vercel.countries.available,
              message: analytics.vercel.countries.message,
              rows: analytics.vercel.countries.rows,
            })}
            {renderBreakdownCard({
              title: analytics.vercel.devices.label,
              available: analytics.vercel.devices.available,
              message: analytics.vercel.devices.message,
              rows: analytics.vercel.devices.rows,
            })}
            {renderBreakdownCard({
              title: analytics.vercel.browsers.label,
              available: analytics.vercel.browsers.available,
              message: analytics.vercel.browsers.message,
              rows: analytics.vercel.browsers.rows,
            })}
          </div>
        </section>

        <section className="admin-panel" aria-label="Analytics readiness and internal metrics">
          <header className="admin-panel-header">
            <div>
              <span className="admin-panel-kicker">Readiness</span>
              <h2>Safe diagnostics and internal counts</h2>
              <p>External analytics reads stay honest, and the internal Supabase counts remain available independently.</p>
            </div>
          </header>

          <AdminDiagnostics diagnostics={analyticsDiagnostics} />

          <ul className="admin-check-list">
            {analyticsChecks.map((check) => (
              <li
                key={check.id}
                className={`admin-check${check.status === "missing" || check.status === "unavailable" ? " admin-check-warning" : ""}`}
              >
                <strong>{check.label}</strong>
                <span>{check.detail}</span>
              </li>
            ))}
          </ul>

          <div className="admin-list-shell">
            <div className="admin-list-heading">
              <h3>Internal metric sources</h3>
              <p>These counts stay inside the product database and do not depend on Vercel traffic analytics.</p>
            </div>
            <ul className="admin-key-value-list">
              <li>
                <span>Generated website records</span>
                <strong>{renderMetricValue(dashboard.websites.total, dashboard.websites.isAvailable)}</strong>
              </li>
              <li>
                <span>Stored versions</span>
                <strong>{renderMetricValue(dashboard.analytics.versionsStored, dashboard.websites.versionsAvailable)}</strong>
              </li>
              <li>
                <span>Live versions stored</span>
                <strong>{renderMetricValue(dashboard.analytics.liveVersions, dashboard.websites.versionsAvailable)}</strong>
              </li>
              <li>
                <span>User growth in 30 days</span>
                <strong>{renderMetricValue(dashboard.analytics.userGrowthLast30Days, dashboard.users.isAvailable)}</strong>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </section>
  );
}

import { routes } from "@/config/routes";
import { formatAdminDate, getAdminDashboardData } from "@/lib/admin/data";
import { requireAdminUser } from "@/lib/supabase/auth";

function renderMetric(value: number | null, emptyLabel = "No data yet"): string {
  return value === null ? emptyLabel : String(value);
}

export default async function AdminMonitoringPage() {
  await requireAdminUser(routes.adminMonitoring);

  const dashboard = await getAdminDashboardData();

  return (
    <section className="dashboard-home-shell" aria-label="Admin monitoring page">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Zero Labs operations</span>
          <h1>Admin Monitoring</h1>
          <p>Review recent activity, failed jobs, and stable monitoring alerts without exposing client-side admin logic.</p>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Admin monitoring summary">
          <span className="dashboard-welcome-label">System status</span>
          <strong>{dashboard.monitoring.systemStatus}</strong>
          <p>{renderMetric(dashboard.monitoring.failedJobs)} failed jobs or retries currently tracked.</p>
        </aside>
      </header>

      <div className="dashboard-two-column-grid">
        <section className="dashboard-panel-shell" aria-label="Admin alerts">
          <header className="dashboard-section-heading">
            <div>
              <h2>Alerts</h2>
              <p>Critical and informational monitoring signals gathered from safe server-side queries.</p>
            </div>
          </header>

          <ul className="dashboard-alert-list">
            {dashboard.monitoring.alerts.map((alert) => (
              <li
                key={alert.id}
                className={`dashboard-alert ${alert.tone === "error" ? "dashboard-alert-error" : alert.tone === "warning" ? "dashboard-alert-warning" : "dashboard-alert-info"}`}
              >
                <div>
                  <strong>{alert.title}</strong>
                  <p>{alert.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="dashboard-panel-shell" aria-label="Admin recent activity">
          <header className="dashboard-section-heading">
            <div>
              <h2>Recent activity</h2>
              <p>Latest website, publishing, and scheduling events currently visible to the admin dashboard.</p>
            </div>
          </header>

          {dashboard.monitoring.recentActivity.length > 0 ? (
            <ul className="dashboard-activity-list">
              {dashboard.monitoring.recentActivity.map((activity) => (
                <li
                  key={activity.id}
                  className={`dashboard-activity-item${activity.tone === "error" ? " dashboard-activity-error" : activity.tone === "warning" ? " dashboard-activity-warning" : ""}`}
                >
                  <div>
                    <strong>{activity.title}</strong>
                    <p>{activity.detail}</p>
                  </div>
                  <span>{formatAdminDate(activity.timestamp)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dashboard-empty-note">No recent monitoring activity yet.</p>
          )}
        </section>
      </div>
    </section>
  );
}

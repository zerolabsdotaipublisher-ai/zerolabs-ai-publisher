import Link from "next/link";
import type { DashboardAlert } from "@/lib/dashboard";

interface DashboardAlertsProps {
  alerts: DashboardAlert[];
}

export function DashboardAlerts({ alerts }: DashboardAlertsProps) {
  return (
    <section className="dashboard-panel-shell" aria-label="Notifications and alerts">
      <header>
        <h2>Notifications and alerts</h2>
        <p>Failures, attention-required conditions, and account/connectivity blockers.</p>
      </header>
      {alerts.length === 0 ? (
        <p className="dashboard-empty-note">No active alerts. Everything looks healthy.</p>
      ) : (
        <ul className="dashboard-alert-list">
          {alerts.map((alert) => (
            <li key={alert.id} className={`dashboard-alert dashboard-alert-${alert.severity}`}>
              <div>
                <strong>{alert.title}</strong>
                <p>{alert.detail}</p>
              </div>
              {alert.actionHref && alert.actionLabel ? (
                <Link href={alert.actionHref} className="dashboard-inline-link">
                  {alert.actionLabel}
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

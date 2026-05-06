import Link from "next/link";
import { routes } from "@/config/routes";
import type { DashboardRecentActivityItem } from "@/lib/dashboard";

interface DashboardRecentActivityProps {
  items: DashboardRecentActivityItem[];
}

export function DashboardRecentActivity({ items }: DashboardRecentActivityProps) {
  return (
    <section className="dashboard-panel-shell" aria-label="Recent activity">
      <header>
        <h2>Recent activity</h2>
        <p>Latest events across generation, publishing, scheduling, and account connections.</p>
        <Link href={routes.activity} className="dashboard-inline-link">
          View full activity overview
        </Link>
      </header>
      {items.length === 0 ? (
        <p className="dashboard-empty-note">No recent activity yet.</p>
      ) : (
        <ul className="dashboard-activity-list">
          {items.map((item) => (
            <li key={item.id} className={`dashboard-activity-item dashboard-activity-${item.status ?? "info"}`}>
              <div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
                <time dateTime={item.timestamp}>{new Date(item.timestamp).toLocaleString()}</time>
              </div>
              {item.href ? (
                <Link href={item.href} className="dashboard-inline-link">
                  Open
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

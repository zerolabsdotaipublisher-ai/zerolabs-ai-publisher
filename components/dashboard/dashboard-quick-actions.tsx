import Link from "next/link";
import type { DashboardQuickAction } from "@/lib/dashboard";

interface DashboardQuickActionsProps {
  actions: DashboardQuickAction[];
  onTrack: (eventName: string) => void;
}

export function DashboardQuickActions({ actions, onTrack }: DashboardQuickActionsProps) {
  return (
    <section className="dashboard-panel-shell" aria-label="Quick actions">
      <header>
        <h2>Quick actions</h2>
        <p>Jump into common publishing workflows.</p>
      </header>
      <div className="dashboard-quick-actions-grid">
        {actions.map((action) => (
          <Link
            key={action.id}
            className="dashboard-quick-action"
            href={action.href}
            onClick={() => onTrack(action.eventName)}
          >
            <strong>{action.label}</strong>
            <span>{action.description}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

import type { ReactNode } from "react";

interface DashboardMetricCardProps {
  label: string;
  value: number;
  hint: string;
  tone?: "default" | "warning" | "error";
  icon?: ReactNode;
}

export function DashboardMetricCard({ label, value, hint, tone = "default", icon }: DashboardMetricCardProps) {
  return (
    <article className={`dashboard-metric-card dashboard-metric-card-${tone}`}>
      <p className="dashboard-metric-label">{label}</p>
      <p className="dashboard-metric-value">{value.toLocaleString()}</p>
      <p className="dashboard-metric-hint">{hint}</p>
      {icon ? <span className="dashboard-metric-icon">{icon}</span> : null}
    </article>
  );
}

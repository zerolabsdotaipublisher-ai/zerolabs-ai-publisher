"use client";

import { useCallback, useEffect, useState } from "react";
import { getDefaultDashboardErrorMessage } from "@/lib/dashboard/client";
import type { DashboardSummary } from "@/lib/dashboard/types";
import { DashboardAlerts } from "./dashboard-alerts";
import { DashboardMetricCard } from "./dashboard-metric-card";
import { DashboardQuickActions } from "./dashboard-quick-actions";
import { DashboardRecentActivity } from "./dashboard-recent-activity";
import { DashboardWebsiteSummarySection } from "./dashboard-website-summary";

interface DashboardSummaryApiResponse {
  ok: boolean;
  summary?: DashboardSummary;
  error?: string;
}

interface DashboardHomeProps {
  initialSummary?: DashboardSummary;
  initialError?: string;
}

const DASHBOARD_SUMMARY_POLL_INTERVAL_MS = 30_000;

async function trackDashboardEvent(eventName: string): Promise<void> {
  await fetch("/api/observability/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: eventName }),
  });
}

function formatDate(dateString?: string): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString(undefined, { year: 'numeric', month: 'short' });
}

export function DashboardHome({ initialSummary, initialError }: DashboardHomeProps) {
  const [summary, setSummary] = useState<DashboardSummary | undefined>(initialSummary);
  const [loading, setLoading] = useState(!initialSummary && !initialError);
  const [error, setError] = useState<string | undefined>(initialError);

  const loadSummary = useCallback(async (options: { silent?: boolean } = {}) => {
    if (!options.silent) {
      setLoading(true);
    }
    setError(undefined);

    try {
      const response = await fetch("/api/dashboard/summary", {
        method: "GET",
        cache: "no-store",
      });
      const body = (await response.json()) as DashboardSummaryApiResponse;
      if (!response.ok || !body.ok || !body.summary) {
        throw new Error(body.error || getDefaultDashboardErrorMessage());
      }

      setSummary(body.summary);
      setError(undefined);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : getDefaultDashboardErrorMessage());
    } finally {
      if (!options.silent) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void loadSummary({ silent: true });
    }, DASHBOARD_SUMMARY_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [loadSummary]);

  async function handleTrack(eventName: string) {
    try {
      await trackDashboardEvent(eventName);
    } catch {
      // no-op; analytics should not block user flow
    }
  }

  async function handleRefresh() {
    await handleTrack("dashboard_refresh_clicked");
    await loadSummary();
  }

  if (loading && !summary) {
    return (
      <section className="dashboard-home-shell" aria-busy="true" aria-label="Loading dashboard">
        <header className="dashboard-home-header">
          <h1>Dashboard</h1>
          <p>Loading your workspace summary...</p>
        </header>
        <div className="dashboard-metrics-grid">
          {Array.from({ length: 4 }).map((_, index) => (
            <article key={index} className="dashboard-metric-card dashboard-skeleton" />
          ))}
        </div>
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="dashboard-home-shell" aria-label="Dashboard unavailable">
        <header className="dashboard-home-header">
          <h1>Dashboard</h1>
          <p>We could not load your dashboard summary.</p>
        </header>
        <p className="dashboard-error-state">{error || getDefaultDashboardErrorMessage()}</p>
        <button type="button" onClick={() => void loadSummary()}>
          Retry
        </button>
      </section>
    );
  }

  const memberSinceStr = formatDate(summary.user.memberSince);

  return (
    <section className="dashboard-home-shell" aria-label="Dashboard homepage">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel" style={{ flex: 1 }}>
          <h1>Dashboard</h1>
          <p>Manage, preview, edit, and share your generated websites.</p>

          <div className="dashboard-welcome-card" style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <span className="dashboard-welcome-label">Workspace User</span>
            <strong>{summary.user.displayName || summary.user.email}</strong>
            <p>{summary.user.email}</p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              {summary.user.plan && (
                <span style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--accent)' }}>
                  {summary.user.plan} Plan
                </span>
              )}
              {memberSinceStr && (
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Member since {memberSinceStr}
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          type="button"
          className="wizard-button-secondary"
          onClick={() => void handleRefresh()}
          disabled={loading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </header>

      {error ? <p className="dashboard-error-state">{error}</p> : null}

      <div className="dashboard-metrics-grid">
        <DashboardMetricCard
          label="Generated websites"
          value={summary.metrics.totalWebsites}
          hint="Total website projects"
        />
        <DashboardMetricCard
          label="Published websites"
          value={summary.metrics.publishedWebsites}
          hint="Currently live websites"
        />
        <DashboardMetricCard
          label="Draft websites"
          value={summary.metrics.draftWebsites}
          hint="Drafts and unpublished changes"
          tone="warning"
        />
        <DashboardMetricCard
          label="Stored pages"
          value={summary.metrics.storedPages}
          hint="From website pages or structure fallback"
        />
      </div>

      <DashboardQuickActions actions={summary.quickActions} onTrack={(eventName) => void handleTrack(eventName)} />
      <DashboardAlerts alerts={summary.alerts} />

      <DashboardWebsiteSummarySection summary={summary.websiteSummary} />

      {summary.recentActivity.length > 0 && (
        <DashboardRecentActivity items={summary.recentActivity} />
      )}
    </section>
  );
}

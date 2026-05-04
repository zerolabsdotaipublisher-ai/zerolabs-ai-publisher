"use client";

import { useState } from "react";
import { getDefaultDashboardErrorMessage, isDashboardSummaryEmpty, type DashboardSummary } from "@/lib/dashboard";
import { DashboardAlerts } from "./dashboard-alerts";
import { DashboardContentSummarySection } from "./dashboard-content-summary";
import { DashboardMetricCard } from "./dashboard-metric-card";
import { DashboardQuickActions } from "./dashboard-quick-actions";
import { DashboardRecentActivity } from "./dashboard-recent-activity";
import { DashboardSocialSummarySection } from "./dashboard-social-summary";
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

async function trackDashboardEvent(eventName: string): Promise<void> {
  await fetch("/api/observability/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: eventName }),
  });
}

export function DashboardHome({ initialSummary, initialError }: DashboardHomeProps) {
  const [summary, setSummary] = useState<DashboardSummary | undefined>(initialSummary);
  const [loading, setLoading] = useState(!initialSummary && !initialError);
  const [error, setError] = useState<string | undefined>(initialError);

  async function loadSummary() {
    setLoading(true);
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
      setLoading(false);
    }
  }

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
          <p>Loading your workspace summary…</p>
        </header>
        <div className="dashboard-metrics-grid">
          {Array.from({ length: 5 }).map((_, index) => (
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

  const empty = isDashboardSummaryEmpty(summary);

  return (
    <section className="dashboard-home-shell" aria-label="Dashboard homepage">
      <header className="dashboard-home-header">
        <div>
          <h1>Dashboard</h1>
          <p>
            Welcome back{summary.user.displayName ? `, ${summary.user.displayName}` : ""}. Here is your publishing
            workspace snapshot.
          </p>
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
          label="Total websites"
          value={summary.metrics.totalWebsites}
          hint="Owned website records"
        />
        <DashboardMetricCard
          label="Published websites + content"
          value={summary.metrics.publishedItems}
          hint="Live websites and published generated content"
        />
        <DashboardMetricCard
          label="Generated content"
          value={summary.metrics.generatedContentCount}
          hint="Website + social generated assets"
        />
        <DashboardMetricCard
          label="Scheduled items"
          value={summary.metrics.scheduledItems}
          hint="Content and social schedules"
          tone="warning"
        />
        <DashboardMetricCard
          label="Needs attention"
          value={summary.metrics.attentionRequiredItems}
          hint="Failures, retries, and account blockers"
          tone={summary.metrics.attentionRequiredItems > 0 ? "error" : "default"}
        />
      </div>

      {empty ? (
        <section className="dashboard-panel-shell">
          <h2>No activity yet</h2>
          <p className="dashboard-empty-note">Create your first website or connect a social account to populate the dashboard.</p>
        </section>
      ) : null}

      <DashboardQuickActions actions={summary.quickActions} onTrack={(eventName) => void handleTrack(eventName)} />
      <DashboardAlerts alerts={summary.alerts} />

      <div className="dashboard-two-column-grid">
        <DashboardWebsiteSummarySection summary={summary.websiteSummary} />
        <DashboardContentSummarySection summary={summary.contentSummary} />
      </div>

      <div className="dashboard-two-column-grid">
        <DashboardSocialSummarySection summary={summary.socialSummary} />
        <DashboardRecentActivity items={summary.recentActivity} />
      </div>
    </section>
  );
}

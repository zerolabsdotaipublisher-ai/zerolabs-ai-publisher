"use client";

import { useCallback, useEffect, useState } from "react";
import { getDefaultDashboardErrorMessage } from "@/lib/dashboard/client";
import type { DashboardSummary } from "@/lib/dashboard/types";
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

const DASHBOARD_SUMMARY_POLL_INTERVAL_MS = 30_000;

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
          label="Generated websites"
          value={summary.metrics.totalWebsites}
          hint="Owner-scoped website records"
        />
        <DashboardMetricCard
          label="Draft websites"
          value={summary.metrics.draftWebsites}
          hint="Drafts and unpublished changes"
          tone="warning"
        />
        <DashboardMetricCard
          label="Published websites"
          value={summary.metrics.publishedWebsites}
          hint="Currently live websites"
        />
        <DashboardMetricCard
          label="Stored pages"
          value={summary.metrics.storedPages}
          hint="From website pages or structure fallback"
        />
        <DashboardMetricCard
          label="Stored versions"
          value={summary.metrics.storedVersions}
          hint="Website version snapshots if configured"
        />
      </div>

      <DashboardQuickActions actions={summary.quickActions} onTrack={(eventName) => void handleTrack(eventName)} />
      <DashboardAlerts alerts={summary.alerts} />
      <DashboardWebsiteSummarySection summary={summary.websiteSummary} />

      <div className="dashboard-two-column-grid">
        <DashboardContentSummarySection summary={summary.contentSummary} />
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
          <DashboardSocialSummarySection summary={summary.socialSummary} />
          <DashboardRecentActivity items={summary.recentActivity} />
        </div>
      </div>
    </section>
  );
}

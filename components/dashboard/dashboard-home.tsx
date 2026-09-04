"use client";

import { useCallback, useEffect, useState } from "react";
import { getDefaultDashboardErrorMessage } from "@/lib/dashboard/client";
import type { DashboardSummary } from "@/lib/dashboard/types";
import { DashboardMetricCard } from "./dashboard-metric-card";
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
        <button type="button" onClick={() => void loadSummary()} className="wizard-button-secondary">
          Retry
        </button>
      </section>
    );
  }

  return (
    <section className="dashboard-home-shell" aria-label="Dashboard homepage">
      <header className="dashboard-home-header">
        <div>
          <h1>Welcome back{summary.user.displayName ? `, ${summary.user.displayName}` : ""}</h1>
          <p>Here&apos;s what&apos;s happening across your website profiles.</p>
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
          label="Website profiles"
          value={summary.metrics.totalWebsites}
          hint="Owner-scoped website records"
        />
        <DashboardMetricCard
          label="Published"
          value={summary.metrics.publishedWebsites}
          hint="Currently live websites"
        />
        <article className="dashboard-metric-card">
          <span className="dashboard-metric-label">Total views</span>
          <strong className="dashboard-metric-value is-muted">
            Not configured
          </strong>
          <span className="dashboard-metric-hint">Analytics not configured yet</span>
        </article>
        <article className="dashboard-metric-card">
          <span className="dashboard-metric-label">Total hearts</span>
          <strong className="dashboard-metric-value is-muted">
            Not configured
          </strong>
          <span className="dashboard-metric-hint">Analytics not configured yet</span>
        </article>
      </div>

      <DashboardWebsiteSummarySection summary={summary.websiteSummary} />
    </section>
  );
}

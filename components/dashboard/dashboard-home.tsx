"use client";

import { useCallback, useEffect, useState } from "react";
import { getDefaultDashboardErrorMessage, isDashboardSummaryEmpty } from "@/lib/dashboard/client";
import type { DashboardSummary } from "@/lib/dashboard/types";
import { DashboardAlerts } from "./dashboard-alerts";
import { DashboardContentSummarySection } from "./dashboard-content-summary";
import { DashboardMetricCard } from "./dashboard-metric-card";
import { DashboardQuickActions } from "./dashboard-quick-actions";
import { DashboardRecentActivity } from "./dashboard-recent-activity";
import { CommunityFeed } from "./community-feed";
import { routes } from "@/config/routes";
import Link from "next/link";

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
    <section className="dashboard-home-shell" aria-label="Dashboard homepage" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1rem' }}>

      <DashboardAlerts alerts={summary.alerts} />

      <div className="dashboard-three-column-layout">
        <style>{`
          .dashboard-three-column-layout {
            display: grid;
            grid-template-columns: 250px 1fr 300px;
            gap: 2rem;
            align-items: start;
          }

          @media (max-width: 1024px) {
            .dashboard-three-column-layout {
              grid-template-columns: 250px 1fr;
            }
            .dashboard-right-sidebar {
              grid-column: 1 / -1;
            }
          }

          @media (max-width: 768px) {
            .dashboard-three-column-layout {
              grid-template-columns: 1fr;
            }
            .dashboard-left-sidebar, .dashboard-right-sidebar {
              grid-column: 1 / -1;
            }
          }

          .dashboard-sidebar-panel {
            background: var(--background);
            border: 1px solid var(--marketing-card-border);
            border-radius: 12px;
            padding: 1.5rem;
          }

          .dashboard-sidebar-nav {
            list-style: none;
            padding: 0;
            margin: 0;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }

          .dashboard-sidebar-nav a {
            display: block;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            color: var(--foreground);
            text-decoration: none;
            transition: background 0.2s;
            font-weight: 500;
          }

          .dashboard-sidebar-nav a:hover {
            background: var(--marketing-surface);
            color: var(--marketing-ocean);
          }
        `}</style>

        {/* Left Column: Profile & Navigation */}
        <aside className="dashboard-left-sidebar">
          <div className="dashboard-sidebar-panel">
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.25rem' }}>{summary.user.displayName || "Zero Labs User"}</h2>
            <p style={{ color: 'var(--marketing-muted)', fontSize: '0.9rem', marginBottom: '1.5rem', wordBreak: 'break-all' }}>{summary.user.email}</p>

            <ul className="dashboard-sidebar-nav">
              <li><Link href={routes.dashboard}>Community Feed</Link></li>
              <li><Link href={routes.websites}>My Websites</Link></li>
              <li><Link href={routes.generateWebsite}>Generate Website</Link></li>
              <li><Link href={routes.profile}>Profile</Link></li>
            </ul>
          </div>

          <div style={{ marginTop: '2rem' }}>
            <DashboardMetricCard
              label="Websites"
              value={summary.metrics.totalWebsites}
              hint="Owned website records"
            />
            <div style={{ height: '1rem' }} />
            <DashboardMetricCard
              label="Content"
              value={summary.metrics.generatedContentCount}
              hint="Website + social generated assets"
            />
          </div>
        </aside>

        {/* Center Column: Feed & Own content */}
        <main className="dashboard-center-feed">
          {error ? <p className="dashboard-error-state">{error}</p> : null}

          {empty ? (
            <section className="dashboard-panel-shell" style={{ marginBottom: '2rem' }}>
              <h2>No activity yet</h2>
              <p className="dashboard-empty-note">Create your first website or connect a social account to populate the dashboard.</p>
            </section>
          ) : null}

          <DashboardQuickActions actions={summary.quickActions} onTrack={(eventName) => void handleTrack(eventName)} />

          <CommunityFeed
             currentUserId={summary.user.id}
             websiteSummary={summary.websiteSummary}
          />
        </main>

        {/* Right Column: Analytics & Extracted pieces */}
        <aside className="dashboard-right-sidebar" id="dashboard-right-sidebar">
          <div className="dashboard-sidebar-panel" style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Activity Summary</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
               <DashboardRecentActivity items={summary.recentActivity} />
            </div>
          </div>

          <div className="dashboard-sidebar-panel">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Content Analytics</h3>
            <DashboardContentSummarySection summary={summary.contentSummary} />
          </div>
        </aside>

      </div>
    </section>
  );
}

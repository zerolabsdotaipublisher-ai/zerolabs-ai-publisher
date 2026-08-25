"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getDefaultDashboardErrorMessage, isDashboardSummaryEmpty } from "@/lib/dashboard/client";
import type { DashboardSummary } from "@/lib/dashboard/types";
import { DashboardAlerts } from "./dashboard-alerts";
import { DashboardContentSummarySection } from "./dashboard-content-summary";


import { DashboardRecentActivity } from "./dashboard-recent-activity";
import { DashboardSocialSummarySection } from "./dashboard-social-summary";
import { DashboardWebsiteSummarySection } from "./dashboard-website-summary";
import { CommunityFeed } from "./community-feed";
import { routes } from "@/config/routes";

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

  const userInitial = summary.user.displayName ? summary.user.displayName.charAt(0).toUpperCase() : summary.user.email.charAt(0).toUpperCase();

  return (
    <section className="dashboard-home-shell" aria-label="Dashboard homepage">

      {error ? <p className="dashboard-error-state">{error}</p> : null}

      <div className="dashboard-three-column-grid">

        {/* Left Column: Sidebar / Shortcuts */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="dashboard-panel-shell" style={{ padding: '1.5rem 1rem' }}>
             <div className="dashboard-sidebar-profile">
               <div className="dashboard-sidebar-profile-avatar">{userInitial}</div>
               <div className="dashboard-sidebar-profile-info">
                 <span className="dashboard-sidebar-profile-name">{summary.user.displayName || "Zero Labs User"}</span>
                 <span className="dashboard-sidebar-profile-stats">{summary.metrics.totalWebsites} websites</span>
               </div>
             </div>

             <ul className="dashboard-sidebar-nav-list">
               <li>
                 <Link href={routes.dashboard} className="dashboard-sidebar-nav-link active">Home</Link>
               </li>
               <li>
                 <Link href={routes.websites} className="dashboard-sidebar-nav-link">My websites</Link>
               </li>
               <li>
                 <Link href={routes.activity} className="dashboard-sidebar-nav-link">Activity</Link>
               </li>
               <li>
                 <Link href={routes.createWebsite} className="dashboard-sidebar-nav-link">Generate Website</Link>
               </li>
               <li>
                 <Link href={routes.insights} className="dashboard-sidebar-nav-link">Insights</Link>
               </li>
               <li>
                 <Link href={routes.profile} className="dashboard-sidebar-nav-link">Profile</Link>
               </li>
             </ul>
          </div>

          <div className="dashboard-panel-shell">
            <header>
              <h2>Workspace Stats</h2>
            </header>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Websites</span>
                 <strong>{summary.metrics.totalWebsites}</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Published</span>
                 <strong>{summary.metrics.publishedItems}</strong>
               </div>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Generated Content</span>
                 <strong>{summary.metrics.generatedContentCount}</strong>
               </div>
            </div>
          </div>
        </aside>

        {/* Center Column: Main Feed */}
        <main style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <header className="dashboard-home-header" style={{ padding: '0', background: 'transparent', border: 'none', marginBottom: '-1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.75rem' }}>Workspace</h1>
              <p>Welcome back, {summary.user.displayName || "user"}.</p>
            </div>
          </header>

          <DashboardAlerts alerts={summary.alerts} />

          {empty ? (
            <section className="dashboard-panel-shell">
              <h2>No activity yet</h2>
              <p className="dashboard-empty-note">Create your first website or connect a social account to populate the dashboard.</p>
            </section>
          ) : null}

          <CommunityFeed currentUserId={summary.user.id} />

          <DashboardWebsiteSummarySection summary={summary.websiteSummary} />
        </main>

        {/* Right Column: Discovery / Suggestions / Activity */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          <div className="dashboard-panel-shell">
            <header>
               <h2>Quick actions</h2>
            </header>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
              {summary.quickActions.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  onClick={() => handleTrack(action.eventName)}
                  className="wizard-button-secondary"
                  style={{ textAlign: 'left', padding: '0.6rem 1rem' }}
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          <DashboardRecentActivity items={summary.recentActivity} />
          <DashboardContentSummarySection summary={summary.contentSummary} />
          <DashboardSocialSummarySection summary={summary.socialSummary} />
        </aside>

      </div>
    </section>
  );
}

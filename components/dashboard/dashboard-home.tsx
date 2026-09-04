"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DashboardAlerts } from "@/components/dashboard/dashboard-alerts";
import { DashboardMetricCard } from "@/components/dashboard/dashboard-metric-card";
import { DashboardRecentActivity } from "@/components/dashboard/dashboard-recent-activity";
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions";
import { DashboardWebsiteSummarySection } from "@/components/dashboard/dashboard-website-summary";
import { WebsiteManagementShell } from "@/components/management/website-management-shell";
import { routes } from "@/config/routes";
import type { DashboardSummary } from "@/lib/dashboard/types";
import type { WebsiteListPage } from "@/lib/management/types";

interface DashboardSummaryApiResponse {
  ok: boolean;
  summary?: DashboardSummary;
}

interface DashboardHomeProps {
  initialSummary?: DashboardSummary;
  initialListing: WebsiteListPage;
  initialListingError?: string;
  userEmail?: string | null;
  displayName?: string;
  currentUserId: string;
}

const DASHBOARD_SUMMARY_POLL_INTERVAL_MS = 30_000;

function formatTimestamp(value?: string): string | null {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp.toLocaleString();
}

function formatDashboardMetric(value: number | null | undefined): number | string {
  return typeof value === "number" ? value : "Not configured";
}

export function DashboardHome({
  initialSummary,
  initialListing,
  initialListingError,
  userEmail,
  displayName,
  currentUserId,
}: DashboardHomeProps) {
  const [summary, setSummary] = useState<DashboardSummary | undefined>(initialSummary);

  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/summary", {
        method: "GET",
        cache: "no-store",
      });
      const body = (await response.json()) as DashboardSummaryApiResponse;

      if (response.ok && body.ok && body.summary) {
        setSummary(body.summary);
      }
    } catch {
      // Summary is secondary to the main website workspace.
    }
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      void loadSummary();
    }, DASHBOARD_SUMMARY_POLL_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [loadSummary]);

  const userDisplayName = summary?.user.displayName ?? displayName;
  const accountEmail = summary?.user.email ?? userEmail;
  const websiteCount = summary?.metrics.totalWebsites ?? initialListing.total;
  const publishedCount = summary?.metrics.publishedWebsites ?? 0;
  const draftCount = summary?.metrics.draftWebsites ?? 0;
  const hasWebsites = websiteCount > 0;
  const lastUpdatedLabel = formatTimestamp(summary?.generatedAt);
  const heroDescription = "Manage, preview, edit, and share your generated website profiles.";
  const workspaceCopy = hasWebsites
    ? summary
      ? `${websiteCount.toLocaleString()} website profile(s) in your workspace, ${publishedCount.toLocaleString()} published and ${draftCount.toLocaleString()} draft.`
      : `${websiteCount.toLocaleString()} website profile(s) currently available in your workspace.`
    : "Generate your first website profile and manage it from here.";

  return (
    <section className="dashboard-home-shell" aria-label="Dashboard homepage">
      <header className="dashboard-home-header">
        <div className="dashboard-hero-panel">
          <span className="dashboard-eyebrow">Dashboard</span>
          <h1>Welcome back</h1>
          <p>{heroDescription}</p>
          <div className="dashboard-header-meta">
            {lastUpdatedLabel ? <span className="dashboard-summary-status">Overview updated {lastUpdatedLabel}</span> : null}
            <span className="dashboard-summary-status">{hasWebsites ? "Website workspace active" : "Ready for your first website profile"}</span>
          </div>
        </div>

        <aside className="dashboard-welcome-card" aria-label="Workspace overview">
          <span className="dashboard-welcome-label">Workspace owner</span>
          <strong>{userDisplayName ?? accountEmail ?? "Zero Labs user"}</strong>
          {userDisplayName && accountEmail ? <p>{accountEmail}</p> : null}
          <p>{workspaceCopy}</p>
          <div className="dashboard-panel-actions">
            <Link href={routes.generateWebsite} className="dashboard-inline-link">
              Generate Website
            </Link>
            <Link href={routes.feed} className="dashboard-inline-link">
              Open Feed
            </Link>
          </div>
        </aside>
      </header>

      {summary ? (
        <>
          <div className="dashboard-metrics-grid">
            <DashboardMetricCard
              label="Website profiles"
              value={summary.metrics.totalWebsites}
              hint="Generated website profiles currently in your workspace"
            />
            <DashboardMetricCard
              label="Published"
              value={summary.metrics.publishedWebsites}
              hint="Website profiles live for visitors"
            />
            <DashboardMetricCard
              label="Total views"
              value={formatDashboardMetric(summary.metrics.totalViews)}
              hint="Website and profile views from configured analytics tables"
            />
            <DashboardMetricCard
              label="Total hearts"
              value={formatDashboardMetric(summary.metrics.totalHearts)}
              hint="Website and feed hearts from configured reaction tables"
            />
          </div>

          <DashboardWebsiteSummarySection summary={summary.websiteSummary} />

          <DashboardQuickActions actions={summary.quickActions} />

          <div className="dashboard-two-column-grid">
            <DashboardAlerts alerts={summary.alerts} />
            <DashboardRecentActivity items={summary.recentActivity} />
          </div>

        </>
      ) : (
        <WebsiteManagementShell
          initialListing={initialListing}
          initialError={initialListingError}
          currentUserId={currentUserId}
          context="dashboard"
          showHeader
          showBulkFoundation={false}
          headerEyebrow="Main workspace"
          headerTitle="Your Websites"
          headerDescription="See every website you own, then preview, edit, publish, and share it from one place."
          headerActions={[
            { href: routes.generateWebsite, label: "Generate Website" },
            { href: routes.feed, label: "Open Feed" },
          ]}
        />
      )}
    </section>
  );
}

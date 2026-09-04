"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { DashboardMetricCard } from "@/components/dashboard/dashboard-metric-card";
import { DashboardWebsiteSummarySection } from "@/components/dashboard/dashboard-website-summary";
import { routes } from "@/config/routes";
import type { DashboardSummary, DashboardWebsiteSummary } from "@/lib/dashboard/types";
import type { WebsiteLifecycleStatus, WebsiteListPage, WebsiteManagementRecord } from "@/lib/management/types";

interface DashboardSummaryApiResponse {
  ok: boolean;
  summary?: DashboardSummary;
  error?: string;
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

function getDashboardMetricHint(value: number | null | undefined, configuredHint: string): string {
  return typeof value === "number" ? configuredHint : "Analytics not configured yet";
}

function isDraftWebsiteStatus(status: WebsiteLifecycleStatus): boolean {
  return status === "draft" || status === "unpublished_changes";
}

function createFallbackWebsiteSummary(websites: WebsiteManagementRecord[]): DashboardWebsiteSummary {
  const generatedWebsites = websites.map((website) => ({
    id: website.id,
    title: website.title || "Untitled website",
    status: website.status,
    statusLabel: website.publishStatus.uiLabel,
    createdAt: website.generatedAt,
    updatedAt: website.lastUpdatedAt,
    publishedAt: website.lastPublishedAt,
    liveUrl: website.liveUrl,
    generatedSitePath: website.generatedSitePath,
    previewPath: website.previewPath,
    editorPath: website.editorPath,
    visibility: "private" as const,
    pageCount: undefined,
    pageCountSource: "unavailable" as const,
    designConfigured: false,
  }));

  return {
    total: websites.length,
    published: generatedWebsites.filter((website) => website.status === "live").length,
    draft: generatedWebsites.filter((website) => isDraftWebsiteStatus(website.status)).length,
    archived: generatedWebsites.filter((website) => website.status === "archived").length,
    attentionRequired: generatedWebsites.filter((website) => website.status === "failed").length,
    storedPages: null,
    storedVersions: null,
    dataSource: "website_structures",
    generatedWebsites,
  };
}

export function DashboardHome({
  initialSummary,
  initialListing,
  initialListingError,
  userEmail,
  displayName,
}: DashboardHomeProps) {
  const [summary, setSummary] = useState<DashboardSummary | undefined>(initialSummary);
  const [summaryError, setSummaryError] = useState<string>();

  const loadSummary = useCallback(async () => {
    try {
      const response = await fetch("/api/dashboard/summary", {
        method: "GET",
        cache: "no-store",
      });
      const body = (await response.json()) as DashboardSummaryApiResponse;

      if (!response.ok || !body.ok || !body.summary) {
        setSummaryError(body.error || "Unable to refresh your dashboard summary right now.");
        return;
      }

      setSummary(body.summary);
      setSummaryError(undefined);
    } catch {
      setSummaryError("Unable to refresh your dashboard summary right now.");
    }
  }, []);

  useEffect(() => {
    let initialLoadTimeoutId: number | undefined;

    if (!initialSummary) {
      initialLoadTimeoutId = window.setTimeout(() => {
        void loadSummary();
      }, 0);
    }

    const intervalId = setInterval(() => {
      void loadSummary();
    }, DASHBOARD_SUMMARY_POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);

      if (initialLoadTimeoutId !== undefined) {
        window.clearTimeout(initialLoadTimeoutId);
      }
    };
  }, [initialSummary, loadSummary]);

  const fallbackWebsiteSummary = createFallbackWebsiteSummary(initialListing.websites);
  const websiteSummary = summary?.websiteSummary ?? fallbackWebsiteSummary;
  const userDisplayName = summary?.user.displayName ?? displayName;
  const accountEmail = summary?.user.email ?? userEmail;
  const websiteCount = summary?.metrics.totalWebsites ?? initialListing.total;
  const publishedCount = summary?.metrics.publishedWebsites ?? fallbackWebsiteSummary.published;
  const draftCount = summary?.metrics.draftWebsites ?? fallbackWebsiteSummary.draft;
  const hasWebsites = websiteCount > 0;
  const lastUpdatedLabel = formatTimestamp(summary?.generatedAt);
  const workspaceError = summaryError ?? (!summary ? initialListingError : undefined);
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

      {workspaceError ? <p className="dashboard-error-state">{workspaceError}</p> : null}

      <div className="dashboard-metrics-grid">
        <DashboardMetricCard
          label="Website profiles"
          value={summary?.metrics.totalWebsites ?? websiteCount}
          hint="Generated website profiles currently in your workspace"
        />
        <DashboardMetricCard
          label="Published"
          value={summary?.metrics.publishedWebsites ?? publishedCount}
          hint="Website profiles live for visitors"
        />
        <DashboardMetricCard
          label="Total views"
          value={formatDashboardMetric(summary?.metrics.totalViews)}
          hint={getDashboardMetricHint(summary?.metrics.totalViews, "Website and profile views from configured analytics tables")}
        />
        <DashboardMetricCard
          label="Total hearts"
          value={formatDashboardMetric(summary?.metrics.totalHearts)}
          hint={getDashboardMetricHint(summary?.metrics.totalHearts, "Website and feed hearts from configured reaction tables")}
        />
      </div>

      <DashboardWebsiteSummarySection summary={websiteSummary} />
    </section>
  );
}

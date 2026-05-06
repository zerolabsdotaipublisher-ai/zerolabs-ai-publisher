"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  PublishingActivityOverview,
  PublishingActivityPlatform,
  PublishingActivityQuickAction,
  PublishingActivitySegment,
  PublishingActivityStatus,
  PublishingActivityContentType,
} from "@/lib/activity/types";
import { ActivityEmptyState } from "./activity-empty-state";
import { ActivityFilters } from "./activity-filters";
import { ActivityItem } from "./activity-item";
import { ActivityLoading } from "./activity-loading";
import { ActivityTimeline } from "./activity-timeline";

interface ActivityOverviewShellProps {
  initialOverview: PublishingActivityOverview;
}

interface ActivityApiResponse {
  ok: boolean;
  overview?: PublishingActivityOverview;
  error?: string;
}

function formatGeneratedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function toDateInput(value: string | undefined): string {
  return value ? value.slice(0, 10) : "";
}

export function ActivityOverviewShell({ initialOverview }: ActivityOverviewShellProps) {
  const [overview, setOverview] = useState(initialOverview);
  const [platform, setPlatform] = useState<PublishingActivityPlatform | "all">(initialOverview.query.platform);
  const [status, setStatus] = useState<PublishingActivityStatus | "all">(initialOverview.query.status);
  const [contentType, setContentType] = useState<PublishingActivityContentType | "all">(initialOverview.query.contentType);
  const [segment, setSegment] = useState<PublishingActivitySegment>(initialOverview.query.segment);
  const [from, setFrom] = useState(toDateInput(initialOverview.query.from));
  const [to, setTo] = useState(toDateInput(initialOverview.query.to));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [actionPendingId, setActionPendingId] = useState<string>();

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    const params = new URLSearchParams();
    if (platform !== "all") params.set("platform", platform);
    if (status !== "all") params.set("status", status);
    if (contentType !== "all") params.set("contentType", contentType);
    if (segment !== "all") params.set("segment", segment);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    params.set("limit", String(initialOverview.query.limit));

    try {
      const response = await fetch(`/api/activity/publishing?${params.toString()}`, {
        method: "GET",
        cache: "no-store",
      });
      const body = (await response.json()) as ActivityApiResponse;
      if (!response.ok || !body.ok || !body.overview) {
        throw new Error(body.error || "Unable to load publishing activity overview.");
      }

      setOverview(body.overview);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load publishing activity overview.");
    } finally {
      setLoading(false);
    }
  }, [contentType, from, initialOverview.query.limit, platform, segment, status, to]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  async function handleApiAction(action: PublishingActivityQuickAction) {
    if (!action.apiPath || action.method !== "POST") {
      return;
    }

    setActionPendingId(action.id);
    setError(undefined);

    try {
      const response = await fetch(action.apiPath, {
        method: action.method,
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) {
        throw new Error(body.error || "Unable to execute activity quick action.");
      }
      await loadOverview();
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Unable to execute activity quick action.");
    } finally {
      setActionPendingId(undefined);
    }
  }

  const hasFilters = Boolean(platform !== "all" || status !== "all" || contentType !== "all" || segment !== "all" || from || to);

  return (
    <section className="activity-overview-shell" aria-label="Publishing activity overview">
      <header className="activity-overview-header">
        <h1>Publishing Activity Overview</h1>
        <p>Operational overview across website publishing, scheduling, history, and social delivery systems.</p>
      </header>

      <ActivityFilters
        platform={platform}
        status={status}
        contentType={contentType}
        segment={segment}
        from={from}
        to={to}
        onPlatformChange={setPlatform}
        onStatusChange={setStatus}
        onContentTypeChange={setContentType}
        onSegmentChange={setSegment}
        onFromChange={setFrom}
        onToChange={setTo}
      />

      <p className="activity-meta">Showing {overview.items.length} items from {formatGeneratedAt(overview.generatedAt)}.</p>

      {error ? (
        <div className="activity-error">
          <p>{error}</p>
          <button type="button" onClick={() => void loadOverview()}>
            Retry
          </button>
        </div>
      ) : null}

      {loading && overview.items.length === 0 ? (
        <ActivityLoading />
      ) : overview.items.length === 0 ? (
        <ActivityEmptyState hasFilters={hasFilters} />
      ) : (
        <>
          <section className="activity-sections-grid" aria-label="Publishing activity sections">
            <section className="dashboard-panel-shell" aria-label="Recent publishing activity">
              <header>
                <h2>Recent activity</h2>
                <p>Latest completed and in-flight events.</p>
              </header>
              <div className="activity-list">
                {(overview.recent.length > 0 ? overview.recent : overview.items).slice(0, 10).map((item) => (
                  <ActivityItem key={`recent_${item.id}`} item={item} actionPendingId={actionPendingId} onApiAction={handleApiAction} />
                ))}
              </div>
            </section>

            <section className="dashboard-panel-shell" aria-label="Upcoming scheduled publishing activity">
              <header>
                <h2>Upcoming scheduled</h2>
                <p>Next scheduled publishing operations.</p>
              </header>
              <div className="activity-list">
                {(overview.upcoming.length > 0 ? overview.upcoming : []).slice(0, 10).map((item) => (
                  <ActivityItem key={`upcoming_${item.id}`} item={item} actionPendingId={actionPendingId} onApiAction={handleApiAction} />
                ))}
                {overview.upcoming.length === 0 ? <p className="dashboard-empty-note">No upcoming scheduled activity.</p> : null}
              </div>
            </section>

            <section className="dashboard-panel-shell" aria-label="Attention required publishing activity">
              <header>
                <h2>Attention required</h2>
                <p>Failed or retry-pending operations needing action.</p>
              </header>
              <div className="activity-list">
                {(overview.attention.length > 0 ? overview.attention : []).slice(0, 10).map((item) => (
                  <ActivityItem key={`attention_${item.id}`} item={item} actionPendingId={actionPendingId} onApiAction={handleApiAction} />
                ))}
                {overview.attention.length === 0 ? <p className="dashboard-empty-note">No failures or retry-pending items.</p> : null}
              </div>
            </section>
          </section>

          <ActivityTimeline groups={overview.timeline} />
        </>
      )}
    </section>
  );
}

"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { PublishStatusBadge } from "@/components/publish/publish-status-badge";
import { routes } from "@/config/routes";
import type { DashboardWebsiteSummary } from "@/lib/dashboard";

interface DashboardWebsiteSummaryProps {
  summary: DashboardWebsiteSummary;
}

function formatDateTime(value?: string): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not available" : date.toLocaleString();
}

function formatPageCount(
  pageCount: number | undefined,
  pageCountSource: DashboardWebsiteSummary["generatedWebsites"][number]["pageCountSource"],
): string {
  if (typeof pageCount === "number") {
    return pageCount.toLocaleString();
  }

  return pageCountSource === "unavailable" ? "Not configured" : "0";
}

function createThumbnailStyle(
  website: DashboardWebsiteSummary["generatedWebsites"][number],
): CSSProperties | undefined {
  if (!website.thumbnailAccentColor && !website.thumbnailSurfaceColor) {
    return undefined;
  }

  const accentColor = website.thumbnailAccentColor ?? "var(--accent)";
  const surfaceColor = website.thumbnailSurfaceColor ?? "color-mix(in srgb, var(--surface) 92%, white 8%)";

  return {
    background: `linear-gradient(145deg, ${surfaceColor} 0%, ${accentColor} 100%)`,
    borderColor: accentColor,
  };
}

function toAbsolutePreviewUrl(previewPath: string): string {
  if (!previewPath.startsWith("/")) {
    return previewPath;
  }

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${previewPath}`;
}

export function DashboardWebsiteSummarySection({ summary }: DashboardWebsiteSummaryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copyErrorId, setCopyErrorId] = useState<string | null>(null);

  const handleCopyLink = useCallback(async (websiteId: string, previewPath: string) => {
    try {
      await navigator.clipboard.writeText(toAbsolutePreviewUrl(previewPath));
      setCopyErrorId((current) => (current === websiteId ? null : current));
      setCopiedId(websiteId);
      window.setTimeout(() => {
        setCopiedId((current) => (current === websiteId ? null : current));
      }, 2000);
    } catch {
      setCopiedId((current) => (current === websiteId ? null : current));
      setCopyErrorId(websiteId);
      window.setTimeout(() => {
        setCopyErrorId((current) => (current === websiteId ? null : current));
      }, 2000);
    }
  }, []);

  return (
    <section className="dashboard-panel-shell dashboard-website-section" aria-label="Your website profiles">
      <header className="dashboard-section-heading">
        <div>
          <h2>Your website profiles</h2>
          <p>See every generated website profile, open the preview, jump into editing, and share it with collaborators.</p>
        </div>

        <div className="dashboard-panel-actions">
          <Link href={routes.generateWebsite} className="dashboard-inline-link">
            Generate Website
          </Link>
          <Link href={routes.websites} className="dashboard-inline-link">
            Open Website List
          </Link>
        </div>
      </header>

      {summary.generatedWebsites.length === 0 ? (
        <div className="dashboard-website-empty">
          <strong>No website profiles yet. Generate your first website to see it here.</strong>
          <Link href={routes.generateWebsite} className="dashboard-website-button is-primary">
            Generate Website
          </Link>
        </div>
      ) : (
        <div className="dashboard-website-grid">
          {summary.generatedWebsites.map((website) => (
            <article key={website.id} className="dashboard-website-card">
              <div className="dashboard-website-thumbnail" style={createThumbnailStyle(website)}>
                <span className="dashboard-website-thumbnail-label">
                  {website.visibility ?? "private"} workspace preview
                </span>
                <strong>{website.title}</strong>
                <span>{website.designConfigured ? "Design configured" : "Design not configured"}</span>
              </div>

              <div className="dashboard-website-card-header">
                <div className="dashboard-website-card-copy">
                  {website.previewPath ? (
                    <Link href={website.previewPath} className="dashboard-website-title">
                      {website.title}
                    </Link>
                  ) : (
                    <strong className="dashboard-website-title">{website.title}</strong>
                  )}
                  <p>Updated {formatDateTime(website.updatedAt)}</p>
                </div>

                <div className="dashboard-website-pill-row">
                  <PublishStatusBadge state={website.status} />
                  <span className={`dashboard-website-visibility is-${website.visibility ?? "private"}`}>
                    {website.visibility ?? "private"}
                  </span>
                </div>
              </div>

              <dl className="dashboard-website-details">
                <div>
                  <dt>Status</dt>
                  <dd>{website.statusLabel}</dd>
                </div>
                <div>
                  <dt>Visibility</dt>
                  <dd>{website.visibility ?? "private"}</dd>
                </div>
                <div>
                  <dt>Pages</dt>
                  <dd>{formatPageCount(website.pageCount, website.pageCountSource)}</dd>
                </div>
              </dl>

              <div className="dashboard-website-actions">
                {website.previewPath ? (
                  <Link href={website.previewPath} className="dashboard-website-button is-primary">
                    Preview
                  </Link>
                ) : (
                  <span className="dashboard-website-button is-secondary" aria-disabled="true">
                    Preview unavailable
                  </span>
                )}
                {website.editorPath ? (
                  <Link href={website.editorPath} className="dashboard-website-button is-secondary">
                    Edit
                  </Link>
                ) : (
                  <span className="dashboard-website-button is-secondary" aria-disabled="true">
                    Edit unavailable
                  </span>
                )}
                <button
                  type="button"
                  className="dashboard-website-button is-secondary"
                  disabled={website.visibility !== "public" || !website.previewPath}
                  title={website.visibility === "public" ? "Copy preview link" : "Make this website public before sharing."}
                  onClick={() => website.previewPath && void handleCopyLink(website.id, website.previewPath)}
                >
                  {copiedId === website.id ? "Copied!" : "Share"}
                </button>
              </div>

              {copyErrorId === website.id ? (
                <p className="website-share-status is-error" role="status" aria-live="polite">
                  Copy failed. Open the preview and copy the URL manually.
                </p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

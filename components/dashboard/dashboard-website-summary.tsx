"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { PublishStatusBadge } from "@/components/publish/publish-status-badge";
import { routes } from "@/config/routes";
import type { DashboardWebsiteSummary } from "@/lib/dashboard";

interface DashboardWebsiteSummaryProps {
  summary: DashboardWebsiteSummary;
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString();
}

function formatDataSourceLabel(value: DashboardWebsiteSummary["dataSource"]): string {
  switch (value) {
    case "website_projects":
      return "Using normalized website project rows.";
    case "hybrid":
      return "Using website projects with structure fallback.";
    default:
      return "Using website structure records.";
  }
}

export function DashboardWebsiteSummarySection({ summary }: DashboardWebsiteSummaryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = useCallback(async (websiteId: string, url: string) => {
    try {
      if (url.startsWith("/")) {
        const origin = typeof window !== "undefined" ? window.location.origin : "";
        await navigator.clipboard.writeText(`${origin}${url}`);
      } else {
        await navigator.clipboard.writeText(url);
      }
      setCopiedId(websiteId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy link: ", err);
    }
  }, []);

  return (
    <section className="dashboard-panel-shell dashboard-website-section" aria-label="Generated websites">
      <header className="dashboard-section-heading">
        <div>
          <h2>Your website profiles</h2>
          <p>Manage, preview, edit, and share your custom websites.</p>
        </div>

        <div className="dashboard-panel-actions">
          <Link href={routes.generateWebsite} className="dashboard-website-button is-primary">
            + New Website
          </Link>
        </div>
      </header>

      {summary.generatedWebsites.length === 0 ? (
        <div className="dashboard-website-empty">
          <strong>No websites yet. Generate your first website.</strong>
          <p>Your dashboard will show preview-ready website cards here as soon as you create one.</p>
          <Link href={routes.generateWebsite} className="dashboard-website-button is-primary">
            Generate Website
          </Link>
        </div>
      ) : (
        <div className="dashboard-website-grid">
          {summary.generatedWebsites.map((website) => (
            <article key={website.id} className="dashboard-website-card">
              <div className="dashboard-website-card-header">
                <div className="dashboard-website-card-copy">
                  {website.previewPath ? (
                    <Link href={website.previewPath} className="dashboard-website-title">
                      {website.title}
                    </Link>
                  ) : (
                    <strong className="dashboard-website-title">{website.title}</strong>
                  )}
                  <p>
                    Created {formatDate(website.createdAt)}
                    {website.updatedAt ? ` | Updated ${formatDate(website.updatedAt)}` : ""}
                  </p>
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
                  <dd>{website.pageCount ?? "Unavailable"}</dd>
                </div>
              </dl>

              <div className="dashboard-website-actions">
                {website.previewPath ? (
                  <Link href={website.previewPath} className="dashboard-website-button is-primary">
                    Preview
                  </Link>
                ) : null}
                {website.editorPath ? (
                  <Link href={website.editorPath} className="dashboard-website-button is-secondary">
                    Edit
                  </Link>
                ) : null}
                <button
                  type="button"
                  className="dashboard-website-button is-secondary"
                  disabled={website.visibility !== "public" || !website.previewPath}
                  title={website.visibility === "public" ? "Copy public link" : "Make this website public before sharing."}
                  onClick={() => website.previewPath && handleCopyLink(website.id, website.previewPath)}
                >
                  {copiedId === website.id ? "Copied!" : "Share"}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <p className="dashboard-section-footnote">{formatDataSourceLabel(summary.dataSource)}</p>
    </section>
  );
}

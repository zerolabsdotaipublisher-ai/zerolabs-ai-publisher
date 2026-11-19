"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { routes } from "@/config/routes";
import type { PublicWebsiteRecord } from "./types";

interface PublicWebsiteListProps {
  websites: PublicWebsiteRecord[];
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown date" : date.toLocaleDateString();
}

export function PublicWebsiteList({ websites }: PublicWebsiteListProps) {
  if (websites.length === 0) {
    return (
      <div className="feed-empty-state is-compact">
        <strong>No public websites shared yet.</strong>
        <p>Public previews will appear here once website visibility is enabled for other users.</p>
      </div>
    );
  }

  return (
    <div className="feed-website-list">
      {websites.map((site) => {
        const title = site.site_title || "Untitled website";

        return (
          <Link
            key={site.id}
            href={routes.liveSite(site.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="feed-website-card feed-website-card-link"
            aria-label={`View ${title}`}
          >
            <div className="feed-website-card-copy">
              <h3>{title}</h3>
              <p className="feed-website-meta">
                Generated {formatDate(site.generated_at)}
                {site.updated_at ? ` | Updated ${formatDate(site.updated_at)}` : ""}
              </p>
            </div>

            <div className="feed-website-card-footer">
              <span className={`feed-website-status is-${site.status}`}>{site.status.replaceAll("_", " ")}</span>
              <span className="feed-inline-link feed-website-card-action">
                View site <ExternalLink size={12} />
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

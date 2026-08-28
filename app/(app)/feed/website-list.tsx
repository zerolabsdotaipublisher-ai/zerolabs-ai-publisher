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
      {websites.map((site) => (
        <article key={site.id} className="feed-website-card">
          <div className="feed-website-card-copy">
            <strong>{site.site_title || "Untitled website"}</strong>
            <p>
              Generated {formatDate(site.generated_at)}
              {site.updated_at ? ` | Updated ${formatDate(site.updated_at)}` : ""}
            </p>
          </div>

          <div className="feed-website-card-footer">
            <span className={`feed-website-status is-${site.status}`}>{site.status.replaceAll("_", " ")}</span>
            <Link href={routes.liveSite(site.id)} target="_blank" className="feed-inline-link">
              View site <ExternalLink size={12} />
            </Link>
          </div>
        </article>
      ))}
    </div>
  );
}

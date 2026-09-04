"use client";

import { useState } from "react";
import { shareWebsiteToFeed } from "@/app/(app)/feed/actions";
import { routes } from "@/config/routes";

interface DashboardWebsiteShareActionsProps {
  structureId: string;
  title: string;
  visibility: "public" | "private";
  published: boolean;
  liveUrl?: string;
}

export function DashboardWebsiteShareActions({
  structureId,
  title,
  visibility: initialVisibility,
  published,
  liveUrl,
}: DashboardWebsiteShareActionsProps) {
  const [visibility, setVisibility] = useState(initialVisibility);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const canShareToFeed = visibility === "public";

  async function copyPublicLink() {
    if (visibility !== "public" || !published) return;

    const publicUrl = liveUrl || `${window.location.origin}${routes.liveSite(structureId)}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setError(undefined);
      setMessage("Public link copied.");
    } catch {
      setError("Copy failed. Open the public site and copy the URL manually.");
    }
  }

  async function makePublic() {
    if (!window.confirm("Make this website public? Anyone with the public link will be able to view it.")) return;

    setIsBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const response = await fetch("/api/dashboard/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "toggle_website_visibility",
          payload: { websiteId: structureId, visibility: "public" },
        }),
      });
      const body = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) {
        setError(body.error || "Unable to make this website public.");
        return;
      }
      setVisibility("public");
      setMessage("Website is public. You can now share it to Feed.");
    } catch {
      setError("Unable to update website visibility.");
    } finally {
      setIsBusy(false);
    }
  }

  async function shareToFeed() {
    if (visibility !== "public") return;

    setIsBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      const result = await shareWebsiteToFeed(structureId, title);
      if (result.error) {
        setError(result.error);
        return;
      }
      setMessage("Website shared to Feed.");
    } catch {
      setError("Unable to share this website to Feed.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="dashboard-website-share-actions">
      <button
        type="button"
        className="dashboard-website-button is-secondary"
        onClick={() => void shareToFeed()}
        disabled={isBusy || !canShareToFeed}
        title={!canShareToFeed ? "Make the website public before sharing it to Feed." : undefined}
      >
        {isBusy && canShareToFeed ? "Sharing..." : "Share to Feed"}
      </button>

      {visibility === "private" ? (
        <button type="button" className="dashboard-website-button is-secondary" onClick={() => void makePublic()} disabled={isBusy}>
          {isBusy ? "Updating..." : "Make public"}
        </button>
      ) : null}

      <button
        type="button"
        className="dashboard-website-button is-secondary"
        onClick={() => void copyPublicLink()}
        disabled={isBusy || visibility !== "public" || !published}
        title={
          visibility !== "public"
            ? "Make the website public and publish it before copying a public link."
            : !published
              ? "Publish the website before copying a public link."
              : undefined
        }
      >
        {visibility !== "public" ? "Copy public link" : published ? "Copy public link" : "Publish to copy link"}
      </button>

      {message || error ? (
        <p className={`website-share-status${error ? " is-error" : ""}`} role="status" aria-live="polite">
          {error || message}
        </p>
      ) : null}
    </div>
  );
}

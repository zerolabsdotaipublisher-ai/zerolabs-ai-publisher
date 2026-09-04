"use client";

import { useState } from "react";

interface ShareResponseBody {
  shareUrl?: string;
  expiresAt?: string;
  error?: string;
}

interface WebsiteShareActionsProps {
  structureId: string;
  disabled?: boolean;
}

export function WebsiteShareActions({ structureId, disabled = false }: WebsiteShareActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [error, setError] = useState<string>();

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setError(undefined);
      setStatus("Share link copied.");
    } catch {
      setError("Copy failed. Open the shared preview and copy the URL manually.");
    }
  }

  async function handleShare() {
    setIsLoading(true);
    setError(undefined);

    try {
      const response = await fetch("/api/preview/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ structureId }),
      });
      const body = (await response.json()) as ShareResponseBody;

      if (!response.ok || !body.shareUrl) {
        setError(body.error || "Unable to create preview share link.");
        return;
      }

      setShareUrl(body.shareUrl);
      setStatus(
        body.expiresAt
          ? `Share link ready until ${new Date(body.expiresAt).toLocaleString()}.`
          : "Share link ready.",
      );
      await copyToClipboard(body.shareUrl);
    } catch {
      setError("Unable to create preview share link.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="website-share-actions">
      <button
        type="button"
        className="wizard-button-secondary"
        onClick={() => void handleShare()}
        disabled={disabled || isLoading}
      >
        {isLoading ? "Creating share link..." : shareUrl ? "Refresh share link" : "Share preview"}
      </button>
      {shareUrl ? (
        <>
          <button
            type="button"
            className="wizard-button-secondary"
            onClick={() => void copyToClipboard(shareUrl)}
            disabled={disabled || isLoading}
          >
            Copy share link
          </button>
          <a className="website-share-link" href={shareUrl} target="_blank" rel="noopener noreferrer">
            Open shared preview
          </a>
        </>
      ) : null}
      {status || error ? (
        <p className={`website-share-status${error ? " is-error" : ""}`} role="status" aria-live="polite">
          {error || status}
        </p>
      ) : null}
    </div>
  );
}

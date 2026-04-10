"use client";

import { useMemo, useState } from "react";

interface ShareResponseBody {
  shareUrl?: string;
  expiresAt?: string;
  error?: string;
}

interface PreviewShareActionsProps {
  structureId: string;
  canShare: boolean;
  sharedPreviewPath?: string;
  sharedPreviewExpiresAt?: string;
}

export function PreviewShareActions({
  structureId,
  canShare,
  sharedPreviewPath,
  sharedPreviewExpiresAt,
}: PreviewShareActionsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | undefined>();
  const [expiresAt, setExpiresAt] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  const resolvedShareUrl = useMemo(() => {
    if (shareUrl) return shareUrl;
    if (!sharedPreviewPath || typeof window === "undefined") return undefined;
    return new URL(sharedPreviewPath, window.location.origin).toString();
  }, [shareUrl, sharedPreviewPath]);

  const resolvedExpiresAt = expiresAt || sharedPreviewExpiresAt;

  async function copyToClipboard(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setError(undefined);
    } catch {
      setError("Copy failed. Please copy the share link manually.");
    }
  }

  async function handleCreateShareLink() {
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
      setExpiresAt(body.expiresAt);
      await copyToClipboard(body.shareUrl);
    } catch {
      setError("Unable to create preview share link.");
    } finally {
      setIsLoading(false);
    }
  }

  if (!canShare) {
    return (
      <p className="preview-share-caption">
        Shared preview mode is read-only.
      </p>
    );
  }

  return (
    <div className="preview-share-actions">
      <button type="button" className="wizard-button-secondary" onClick={() => void handleCreateShareLink()} disabled={isLoading}>
        {isLoading ? "Creating share link…" : "Create share link"}
      </button>
      {resolvedShareUrl ? (
        <button type="button" className="wizard-button-secondary" onClick={() => void copyToClipboard(resolvedShareUrl)}>
          Copy share link
        </button>
      ) : null}
      {resolvedShareUrl ? <p className="preview-share-caption">{resolvedShareUrl}</p> : null}
      {resolvedExpiresAt ? (
        <p className="preview-share-caption">Expires: {new Date(resolvedExpiresAt).toLocaleString()}</p>
      ) : null}
      {error ? <p className="preview-share-caption">{error}</p> : null}
    </div>
  );
}

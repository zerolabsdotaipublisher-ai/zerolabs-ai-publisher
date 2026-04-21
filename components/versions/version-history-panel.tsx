"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type VersionEntry = {
  id: string;
  versionNumber: number;
  label: string;
  status: "draft" | "published" | "archived" | "restored";
  source: "generate" | "draft_save" | "publish" | "update" | "restore";
  structureVersion: number;
  isLive: boolean;
  isCurrentDraft: boolean;
  restoredFromVersionId?: string;
  createdAt: string;
  deployment?: {
    deploymentId?: string;
    providerDeploymentId?: string;
    liveUrl?: string;
    publicationVersionId?: string;
  };
  comparison: {
    sameAsCurrent: boolean;
    plan: {
      summary: string;
      scope: {
        changeKinds: Array<"content" | "structure" | "layout" | "seo" | "routing">;
        routePaths: string[];
      };
    };
  };
};

interface VersionHistoryPanelProps {
  structureId: string;
  entries: VersionEntry[];
}

function formatSource(source: VersionEntry["source"]): string {
  switch (source) {
    case "generate":
      return "Initial generation";
    case "draft_save":
      return "Draft save";
    case "publish":
      return "Publish";
    case "update":
      return "Deployment update";
    case "restore":
      return "Restore";
    default:
      return source;
  }
}

export function VersionHistoryPanel({ structureId, entries }: VersionHistoryPanelProps) {
  const router = useRouter();
  const [pendingVersionId, setPendingVersionId] = useState<string>();
  const [error, setError] = useState<string>();
  const [success, setSuccess] = useState<string>();

  async function handleRestore(versionId: string) {
    setPendingVersionId(versionId);
    setError(undefined);
    setSuccess(undefined);

    try {
      const response = await fetch("/api/versions/restore", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ structureId, versionId }),
      });

      const body = (await response.json().catch(() => ({}))) as { error?: string; restoredVersion?: { versionNumber: number } };
      if (!response.ok) {
        setError(body.error ?? "Unable to restore the selected version.");
        return;
      }

      setSuccess(
        body.restoredVersion
          ? `Working draft restored. New version ${body.restoredVersion.versionNumber} recorded.`
          : "Working draft restored successfully.",
      );
      router.refresh();
    } catch {
      setError("Unable to restore the selected version.");
    } finally {
      setPendingVersionId(undefined);
    }
  }

  return (
    <section className="version-history-panel" aria-label="Website version history">
      <div className="version-history-header">
        <div>
          <h2>Version history</h2>
          <p>Version snapshots stay product-owned in AI Publisher and align with the current draft and live deployment state.</p>
        </div>
        <span>{entries.length} recorded versions</span>
      </div>

      {error ? (
        <p className="version-history-error" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="version-history-success" role="status">
          {success}
        </p>
      ) : null}

      <div className="version-history-list">
        {entries.length === 0 ? <p>No version snapshots have been recorded yet.</p> : null}
        {entries.map((entry) => (
          <article key={entry.id} className="version-history-item">
            <div className="version-history-item-header">
              <strong>Version {entry.versionNumber}</strong>
              <span>{entry.label}</span>
            </div>

            <div className="version-history-item-flags">
              <span className="version-history-badge">{entry.status}</span>
              <span className="version-history-badge">{formatSource(entry.source)}</span>
              {entry.isLive ? <span className="version-history-badge version-history-badge-live">Live</span> : null}
              {entry.isCurrentDraft ? <span className="version-history-badge version-history-badge-current">Current draft</span> : null}
            </div>

            <div className="version-history-item-meta">
              <span>Structure v{entry.structureVersion}</span>
              <time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time>
              {entry.deployment?.deploymentId ? <span>Deployment {entry.deployment.deploymentId}</span> : null}
              {entry.deployment?.publicationVersionId ? <span>{entry.deployment.publicationVersionId}</span> : null}
              {entry.restoredFromVersionId ? <span>Restored from {entry.restoredFromVersionId}</span> : null}
            </div>

            <p className="version-history-summary">{entry.comparison.plan.summary}</p>
            <div className="version-history-item-meta">
              <span>
                Change kinds: {entry.comparison.plan.scope.changeKinds.length ? entry.comparison.plan.scope.changeKinds.join(", ") : "none"}
              </span>
              <span>
                Routes: {entry.comparison.plan.scope.routePaths.length ? entry.comparison.plan.scope.routePaths.join(", ") : "unchanged"}
              </span>
            </div>

            <div className="version-history-item-actions">
              <button
                type="button"
                onClick={() => {
                  void handleRestore(entry.id);
                }}
                disabled={pendingVersionId === entry.id || entry.comparison.sameAsCurrent}
              >
                {pendingVersionId === entry.id ? "Restoring…" : entry.comparison.sameAsCurrent ? "Current draft" : "Restore to draft"}
              </button>
              {entry.deployment?.liveUrl ? (
                <a href={entry.deployment.liveUrl} target="_blank" rel="noreferrer">
                  Open live URL
                </a>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

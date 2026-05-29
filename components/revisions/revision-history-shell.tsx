"use client";

import { useMemo, useState } from "react";
import type { ContentRevisionRecord, RevisionCompareResult } from "@/lib/revisions/types";
import { RevisionCompareView } from "./revision-compare-view";
import { RevisionDetail } from "./revision-detail";
import { RevisionList } from "./revision-list";
import { RevisionRestoreDialog } from "./revision-restore-dialog";

interface RevisionHistoryShellProps {
  contentId: string;
  initialEntries: ContentRevisionRecord[];
  scenarios: string[];
  mvpBoundaries: string[];
}

interface CompareResponse {
  ok: boolean;
  comparison?: RevisionCompareResult;
  error?: string;
}

interface RestoreResponse {
  ok: boolean;
  restoredRevision?: ContentRevisionRecord;
  error?: string;
}

export function RevisionHistoryShell({ contentId, initialEntries, scenarios, mvpBoundaries }: RevisionHistoryShellProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [selectedRevisionId, setSelectedRevisionId] = useState<string | undefined>(initialEntries[0]?.id);
  const [compareLeftId, setCompareLeftId] = useState<string | undefined>(initialEntries[1]?.id);
  const [compareRightId, setCompareRightId] = useState<string | undefined>(initialEntries[0]?.id);
  const [comparison, setComparison] = useState<RevisionCompareResult>();
  const [compareError, setCompareError] = useState<string>();
  const [compareLoading, setCompareLoading] = useState(false);
  const [restoreRevisionId, setRestoreRevisionId] = useState<string>();
  const [restoreError, setRestoreError] = useState<string>();
  const [restoreMessage, setRestoreMessage] = useState<string>();
  const [restoringRevisionId, setRestoringRevisionId] = useState<string>();

  const selectedRevision = useMemo(
    () => entries.find((entry) => entry.id === selectedRevisionId),
    [entries, selectedRevisionId],
  );

  async function runCompare() {
    if (!compareLeftId || !compareRightId) {
      setCompareError("Choose two revisions to compare.");
      return;
    }

    setCompareLoading(true);
    setCompareError(undefined);
    setComparison(undefined);

    try {
      const response = await fetch(`/api/revisions/${encodeURIComponent(contentId)}/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leftRevisionId: compareLeftId, rightRevisionId: compareRightId }),
      });

      const body = (await response.json()) as CompareResponse;
      if (!response.ok || !body.ok || !body.comparison) {
        setCompareError(body.error || "Unable to compare revisions.");
        return;
      }

      setComparison(body.comparison);
    } catch {
      setCompareError("Unable to compare revisions.");
    } finally {
      setCompareLoading(false);
    }
  }

  async function confirmRestore() {
    if (!restoreRevisionId) {
      return;
    }

    setRestoreError(undefined);
    setRestoreMessage(undefined);
    setRestoringRevisionId(restoreRevisionId);

    try {
      const response = await fetch(`/api/revisions/${encodeURIComponent(contentId)}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId: restoreRevisionId, confirm: true }),
      });

      const body = (await response.json()) as RestoreResponse;
      if (!response.ok || !body.ok || !body.restoredRevision) {
        setRestoreError(body.error || "Unable to restore revision.");
        return;
      }

      setEntries((current) => [body.restoredRevision as ContentRevisionRecord, ...current]);
      setSelectedRevisionId(body.restoredRevision.id);
      setRestoreMessage(`Restored successfully. New revision v${body.restoredRevision.versionNumber} created.`);
      setRestoreRevisionId(undefined);
    } catch {
      setRestoreError("Unable to restore revision.");
    } finally {
      setRestoringRevisionId(undefined);
    }
  }

  return (
    <section className="review-shell" aria-label="Content revision history">
      <header className="review-header">
        <h1>Content revision history</h1>
        <p>Track snapshots, compare revisions, and restore safely without bypassing review/approval workflow.</p>
      </header>

      {restoreError ? <p role="alert">{restoreError}</p> : null}
      {restoreMessage ? <p role="status">{restoreMessage}</p> : null}

      <div className="review-detail-grid">
        <RevisionList
          entries={entries}
          selectedRevisionId={selectedRevisionId}
          compareLeftId={compareLeftId}
          compareRightId={compareRightId}
          restoringRevisionId={restoringRevisionId}
          onSelect={setSelectedRevisionId}
          onToggleCompareLeft={setCompareLeftId}
          onToggleCompareRight={setCompareRightId}
          onRestore={setRestoreRevisionId}
        />

        <div>
          <RevisionDetail revision={selectedRevision} />
          <RevisionCompareView
            loading={compareLoading}
            error={compareError}
            comparison={comparison}
            onCompare={() => void runCompare()}
            canCompare={Boolean(compareLeftId && compareRightId)}
          />

          <section aria-label="Revision boundaries and scenarios">
            <h2>MVP boundaries</h2>
            <ul>
              {mvpBoundaries.map((boundary) => (
                <li key={boundary}>{boundary}</li>
              ))}
            </ul>
            <h3>Scenarios</h3>
            <ul>
              {scenarios.map((scenario) => (
                <li key={scenario}>{scenario}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <RevisionRestoreDialog
        revisionId={restoreRevisionId}
        pending={Boolean(restoringRevisionId)}
        onCancel={() => setRestoreRevisionId(undefined)}
        onConfirm={() => void confirmRestore()}
      />
    </section>
  );
}

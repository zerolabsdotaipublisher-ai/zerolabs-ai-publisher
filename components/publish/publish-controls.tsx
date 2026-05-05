"use client";

import { useEffect, useMemo, useState } from "react";
import type { WebsiteStructure } from "@/lib/ai/structure";
import {
  trackPublishEvent,
  type PublishAction,
  type PublishMutationResponse,
} from "@/lib/publish";
import { buildPublishingStatusFromStructure, type PublishStatusApiResponse } from "@/lib/publish/status";
import { LiveLinkCard } from "./live-link-card";
import { PublishConfirmationDialog } from "./publish-confirmation-dialog";
import { PublishErrorState } from "./publish-error-state";
import { PublishLoadingState } from "./publish-loading-state";
import { PublishStatusSummary } from "./publish-status-summary";
import { PublishSuccessState } from "./publish-success-state";

interface PublishControlsProps {
  structure: WebsiteStructure;
  hasUnsavedChanges?: boolean;
  context: "editor" | "preview";
}

export function PublishControls({ structure, hasUnsavedChanges = false, context }: PublishControlsProps) {
  const [website, setWebsite] = useState<WebsiteStructure>(structure);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string>();
  const [statusSnapshot, setStatusSnapshot] = useState<ReturnType<typeof buildPublishingStatusFromStructure>>();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setWebsite(structure);
    setStatusSnapshot(undefined);
  }, [structure]);

  const localStatus = useMemo(() => buildPublishingStatusFromStructure(website), [website]);
  const status = statusSnapshot ?? localStatus;
  const detection = status.detection;
  const validation = status.validation;

  const action: PublishAction = status.action.publishAction;
  const buttonLabel = status.action.publishActionLabel;

  const blockedByUnsaved = context === "editor" && hasUnsavedChanges;
  const blockedByValidation = !validation.eligible;
  const blockedBecauseNoUpdates = action === "update" && !status.hasUnpublishedChanges;
  const blockedByStatus = !status.action.canTriggerPublishAction;

  useEffect(() => {
    let active = true;
    let intervalId: ReturnType<typeof setInterval> | undefined;

    async function loadStatus(silent = true) {
      if (!silent) {
        setStatusLoading(true);
      }

      try {
        const response = await fetch(`/api/publish/status?structureId=${encodeURIComponent(website.id)}`, {
          method: "GET",
          cache: "no-store",
        });
        const body = (await response.json()) as PublishStatusApiResponse;

        if (!response.ok || !body.ok || !body.status) {
          throw new Error(body.error || "Unable to refresh publishing status.");
        }

        if (!active) {
          return;
        }

        setStatusSnapshot(body.status);
        setStatusError(undefined);
      } catch (statusLoadError) {
        if (!active) {
          return;
        }

        setStatusError(statusLoadError instanceof Error ? statusLoadError.message : "Unable to refresh publishing status.");
      } finally {
        if (!silent && active) {
          setStatusLoading(false);
        }
      }
    }

    void loadStatus(false);
    intervalId = setInterval(() => {
      void loadStatus(true);
    }, 15000);

    return () => {
      active = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [website.id]);

  async function sendPublishRequest(selectedAction: PublishAction) {
    setLoading(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    const endpoint = selectedAction === "publish" ? "/api/publish" : "/api/publish/update";

    void trackPublishEvent({
      event: "publish_started",
      structureId: website.id,
      action: selectedAction,
        state: detection.state,
      });

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ structureId: website.id }),
      });

      const body = (await response.json()) as PublishMutationResponse;

      if (!response.ok || !body.ok || !body.structure || !body.detection) {
        if (body.structure) {
          setWebsite(body.structure);
        }
        const message = body.error || "Publish action failed.";
        setErrorMessage(message);
        void trackPublishEvent({
          event: "publish_failed",
          structureId: website.id,
          action: selectedAction,
          state: detection.state,
          message,
        });
        return;
      }

      setWebsite(body.structure);

      if (!body.didDeploy && selectedAction === "update") {
        void trackPublishEvent({
          event: "update_noop",
          structureId: website.id,
          action: selectedAction,
          state: body.detection.state,
          message: body.message,
        });
      } else if (selectedAction === "publish") {
        void trackPublishEvent({
          event: "publish_completed",
          structureId: website.id,
          action: selectedAction,
          state: body.detection.state,
        });
      } else {
        void trackPublishEvent({
          event: "update_completed",
          structureId: website.id,
          action: selectedAction,
          state: body.detection.state,
        });
      }

      setSuccessMessage(
        body.message ??
          (selectedAction === "publish"
            ? "Website published successfully."
            : "Live website updated successfully."),
      );
      setStatusSnapshot(undefined);
    } catch {
      setErrorMessage("Publish action failed unexpectedly.");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  }

  function handleOpenConfirmation() {
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    if (blockedByUnsaved) {
      setErrorMessage("Save your current edits before publishing.");
      return;
    }

    if (blockedByValidation) {
      setErrorMessage("This website is not eligible for publish. Resolve validation issues first.");
      return;
    }

    if (blockedBecauseNoUpdates) {
      setErrorMessage("No saved unpublished changes are available to update.");
      return;
    }

    if (blockedByStatus && status.action.disableReason) {
      setErrorMessage(status.action.disableReason);
      return;
    }

    setConfirmOpen(true);
  }

  function handleRetry() {
    void trackPublishEvent({
      event: "publish_retry_clicked",
      structureId: website.id,
      action,
      state: detection.state,
    });
    void sendPublishRequest(action);
  }

  const publishButtonDisabled = loading || blockedByUnsaved || blockedByValidation || blockedBecauseNoUpdates || blockedByStatus;

  return (
    <section className="publish-controls" aria-label="Publish controls">
      <div className="publish-controls-header">
        <h2>Publication</h2>
      </div>
      <PublishStatusSummary status={status} loading={statusLoading} error={statusError} />

      {blockedByUnsaved ? <p className="publish-warning">You have unsaved edits. Save draft first.</p> : null}
      {blockedByStatus && status.action.disableReason ? <p className="publish-warning">{status.action.disableReason}</p> : null}
      {blockedByValidation ? (
        <ul className="publish-validation-errors">
          {validation.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      <div className="publish-controls-actions">
        <button type="button" onClick={handleOpenConfirmation} disabled={publishButtonDisabled}>
          {loading ? "Processing…" : buttonLabel}
        </button>
      </div>

      {loading ? <PublishLoadingState action={action} /> : null}
      {successMessage ? <PublishSuccessState message={successMessage} /> : null}
      {errorMessage ? <PublishErrorState message={errorMessage} onRetry={detection.hasFailedUpdate ? handleRetry : undefined} /> : null}

      <LiveLinkCard
        liveUrl={status.liveUrl}
        lastPublishedAt={status.timestamps.lastPublishedAt}
        lastDraftUpdatedAt={status.timestamps.lastDraftUpdatedAt}
      />

      <PublishConfirmationDialog
        open={confirmOpen}
        action={action}
        hasUnpublishedChanges={status.hasUnpublishedChanges}
        hasUnsavedChanges={hasUnsavedChanges}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void sendPublishRequest(action);
        }}
      />
    </section>
  );
}

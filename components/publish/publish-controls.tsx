"use client";

import { useEffect, useMemo, useState } from "react";
import type { WebsiteStructure } from "@/lib/ai/structure";
import {
  detectPublicationState,
  trackPublishEvent,
  type PublishAction,
  type PublishMutationResponse,
} from "@/lib/publish";
import { validatePublishEligibility } from "@/lib/publish/validation";
import { LiveLinkCard } from "./live-link-card";
import { PublishConfirmationDialog } from "./publish-confirmation-dialog";
import { PublishErrorState } from "./publish-error-state";
import { PublishLoadingState } from "./publish-loading-state";
import { PublishStatusBadge } from "./publish-status-badge";
import { PublishSuccessState } from "./publish-success-state";

interface PublishControlsProps {
  structure: WebsiteStructure;
  hasUnsavedChanges?: boolean;
  context: "editor" | "preview";
}

export function PublishControls({ structure, hasUnsavedChanges = false, context }: PublishControlsProps) {
  const [website, setWebsite] = useState<WebsiteStructure>(structure);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    setWebsite(structure);
  }, [structure]);

  const detection = useMemo(() => detectPublicationState(website), [website]);
  const validation = useMemo(() => validatePublishEligibility(website), [website]);

  const action: PublishAction = detection.neverPublished ? "publish" : "update";
  const buttonLabel = detection.neverPublished ? "Publish website" : "Update live website";

  const blockedByUnsaved = context === "editor" && hasUnsavedChanges;
  const blockedByValidation = !validation.eligible;
  const blockedBecauseNoUpdates = !detection.neverPublished && !detection.hasUnpublishedChanges;

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

      if (selectedAction === "publish") {
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

      setSuccessMessage(selectedAction === "publish" ? "Website published successfully." : "Live website updated successfully.");
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

  const controlsDisabled = loading || blockedByUnsaved || blockedByValidation || blockedBecauseNoUpdates;

  return (
    <section className="publish-controls" aria-label="Publish controls">
      <div className="publish-controls-header">
        <h2>Publication</h2>
        <PublishStatusBadge state={detection.state} />
      </div>

      {blockedByUnsaved ? <p className="publish-warning">You have unsaved edits. Save draft first.</p> : null}
      {blockedByValidation ? (
        <ul className="publish-validation-errors">
          {validation.errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}

      <div className="publish-controls-actions">
        <button type="button" onClick={handleOpenConfirmation} disabled={controlsDisabled}>
          {loading ? "Processing…" : buttonLabel}
        </button>
      </div>

      {loading ? <PublishLoadingState action={action} /> : null}
      {successMessage ? <PublishSuccessState message={successMessage} /> : null}
      {errorMessage ? <PublishErrorState message={errorMessage} onRetry={detection.hasFailedUpdate ? handleRetry : undefined} /> : null}

      <LiveLinkCard
        liveUrl={detection.liveUrl}
        lastPublishedAt={detection.lastPublishedAt}
        lastDraftUpdatedAt={detection.lastDraftUpdatedAt}
      />

      <PublishConfirmationDialog
        open={confirmOpen}
        action={action}
        hasUnpublishedChanges={detection.hasUnpublishedChanges}
        hasUnsavedChanges={hasUnsavedChanges}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void sendPublishRequest(action);
        }}
      />
    </section>
  );
}

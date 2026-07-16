"use client";

import { useEffect, useMemo, useState } from "react";
import type { WebsiteStructure } from "@/lib/ai/structure";
import {
  trackPublishEvent,
  type PublishAction,
  type PublishMutationResponse,
} from "@/lib/publish";
import { buildPublishingStatusFromStructure, type PublishStatusApiResponse } from "@/lib/publish/status";
import type { ManualOverrideScenario } from "@/lib/publish/override/types";
import { LiveLinkCard } from "./live-link-card";
import { ManualOverrideButton } from "./manual-override-button";
import { ManualOverrideDialog } from "./manual-override-dialog";
import { ManualOverrideStatus } from "./manual-override-status";
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

const PUBLISH_STATUS_POLL_INTERVAL_MS = 15_000;

function getInitialPublishingStatus(structure: WebsiteStructure) {
  try {
    return {
      status: buildPublishingStatusFromStructure(structure),
      error: undefined,
    };
  } catch (error) {
    console.error("Failed to build publishing status for preview controls", {
      structureId: structure.id,
      error,
    });
    return {
      status: undefined,
      error: "Publishing controls are temporarily unavailable for this preview.",
    };
  }
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
  const [manualOverrideOpen, setManualOverrideOpen] = useState(false);
  const [manualOverrideLoading, setManualOverrideLoading] = useState(false);
  const [manualOverrideDialogVersion, setManualOverrideDialogVersion] = useState(0);
  const [overrideStatus, setOverrideStatus] = useState<PublishStatusApiResponse["overrideStatus"]>();

  useEffect(() => {
    setWebsite(structure);
    setStatusSnapshot(undefined);
  }, [structure]);

  const localStatusState = useMemo(() => getInitialPublishingStatus(website), [website]);
  const localStatus = localStatusState.status;
  const status = statusSnapshot ?? localStatus;

  useEffect(() => {
    if (!localStatus) {
      return;
    }

    let active = true;

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
        setOverrideStatus(body.overrideStatus);
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
    const intervalId = setInterval(() => {
      void loadStatus(true);
    }, PUBLISH_STATUS_POLL_INTERVAL_MS);

    return () => {
      active = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [localStatus, website.id]);

  if (!status) {
    return (
      <section className="publish-controls" aria-label="Publish controls">
        <div className="publish-controls-header">
          <h2>Publication</h2>
        </div>
        <PublishErrorState message={localStatusState.error || "Publishing controls are unavailable."} />
      </section>
    );
  }

  const resolvedStatus = status;
  const detection = resolvedStatus.detection;
  const validation = resolvedStatus.validation;

  const action: PublishAction = resolvedStatus.action.publishAction;
  const buttonLabel = resolvedStatus.action.publishActionLabel;

  const blockedByUnsaved = context === "editor" && hasUnsavedChanges;
  const blockedByValidation = !validation.eligible;
  const blockedBecauseNoUpdates = action === "update" && !resolvedStatus.hasUnpublishedChanges;
  const blockedByStatus = !resolvedStatus.action.canTriggerPublishAction;

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

  async function sendManualOverrideRequest(payload: {
    reason: string;
    scenario: ManualOverrideScenario;
    bypassApproval: boolean;
  }) {
    setManualOverrideLoading(true);
    setLoading(true);
    setErrorMessage(undefined);
    setSuccessMessage(undefined);

    try {
      const response = await fetch("/api/publish/override", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          structureId: website.id,
          targetContentType:
            website.websiteType === "blog"
              ? "blog_post"
              : website.websiteType === "article"
                ? "article"
                : "website",
          reason: payload.reason,
          scenario: payload.scenario,
          bypassApproval: payload.bypassApproval,
        }),
      });

      const body = (await response.json()) as {
        ok: boolean;
        error?: string;
        message?: string;
        publish?: PublishMutationResponse;
      };

      if (!response.ok || !body.ok) {
        setErrorMessage(body.error || "Manual override failed.");
        return;
      }

      if (body.publish?.structure) {
        setWebsite(body.publish.structure);
      }

      setSuccessMessage(body.message || "Manual publishing override completed successfully.");
      void trackPublishEvent({
        event: "manual_override_used",
        structureId: website.id,
        action,
        state: detection.state,
        message: body.message,
      });
      setStatusSnapshot(undefined);
      setManualOverrideOpen(false);
    } catch {
      setErrorMessage("Manual override failed unexpectedly.");
    } finally {
      setLoading(false);
      setManualOverrideLoading(false);
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

    if (blockedByStatus && resolvedStatus.action.disableReason) {
      setErrorMessage(resolvedStatus.action.disableReason);
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
  const manualOverrideDisabled = loading || manualOverrideLoading || !overrideStatus?.canUseOverride;

  return (
    <section className="publish-controls" aria-label="Publish controls">
      <div className="publish-controls-header">
        <h2>Publication</h2>
      </div>
      <PublishStatusSummary status={resolvedStatus} loading={statusLoading} error={statusError} />

      {blockedByUnsaved ? <p className="publish-warning">You have unsaved edits. Save draft first.</p> : null}
      {blockedByStatus && resolvedStatus.action.disableReason ? <p className="publish-warning">{resolvedStatus.action.disableReason}</p> : null}
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
        <ManualOverrideButton
          disabled={manualOverrideDisabled}
          loading={manualOverrideLoading}
          onClick={() => {
            setManualOverrideDialogVersion((current) => current + 1);
            setManualOverrideOpen(true);
          }}
        />
      </div>

      {loading ? <PublishLoadingState action={action} /> : null}
      {successMessage ? <PublishSuccessState message={successMessage} /> : null}
      {errorMessage ? <PublishErrorState message={errorMessage} onRetry={detection.hasFailedUpdate ? handleRetry : undefined} /> : null}

      <LiveLinkCard
        liveUrl={resolvedStatus.liveUrl}
        lastPublishedAt={resolvedStatus.timestamps.lastPublishedAt}
        lastDraftUpdatedAt={resolvedStatus.timestamps.lastDraftUpdatedAt}
      />
      <ManualOverrideStatus status={resolvedStatus} />

      <PublishConfirmationDialog
        open={confirmOpen}
        action={action}
        hasUnpublishedChanges={resolvedStatus.hasUnpublishedChanges}
        hasUnsavedChanges={hasUnsavedChanges}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          void sendPublishRequest(action);
        }}
      />
      <ManualOverrideDialog
        key={manualOverrideDialogVersion}
        open={manualOverrideOpen}
        loading={manualOverrideLoading}
        canBypassApproval={Boolean(overrideStatus?.canBypassApproval)}
        onCancel={() => setManualOverrideOpen(false)}
        onConfirm={(payload) => {
          void sendManualOverrideRequest(payload);
        }}
      />
    </section>
  );
}

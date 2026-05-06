"use client";

import Link from "next/link";
import { useState } from "react";
import type { ReviewDetail, ReviewState } from "@/lib/review/types";
import { ReviewStatusBadge } from "./review-status-badge";

interface ReviewActionBarProps {
  initialDetail: ReviewDetail;
}

interface ReviewActionResponse {
  ok: boolean;
  detail?: ReviewDetail;
  error?: string;
  validationErrors?: string[];
}

async function parseActionResponse(response: Response): Promise<ReviewActionResponse> {
  try {
    return (await response.json()) as ReviewActionResponse;
  } catch {
    return { ok: false, error: "Unexpected API response format." };
  }
}

export function ReviewActionBar({ initialDetail }: ReviewActionBarProps) {
  const [detail, setDetail] = useState(initialDetail);
  const [note, setNote] = useState(initialDetail.reviewNote ?? "");
  const [socialTitle, setSocialTitle] = useState(initialDetail.item.title);
  const [loadingState, setLoadingState] = useState<"approve" | "reject" | "needs_changes" | "regenerate" | "save" | undefined>();
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function runAction(action: "approve" | "reject" | "needs_changes" | "regenerate"): Promise<void> {
    setLoadingState(action);
    setError(undefined);
    setMessage(undefined);

    const endpoint =
      action === "approve"
        ? "approve"
        : action === "regenerate"
          ? "regenerate"
          : "reject";

    const response = await fetch(`/api/review/${encodeURIComponent(detail.contentId)}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: action === "reject" || action === "needs_changes"
        ? JSON.stringify({ note: note.trim() || undefined, state: action })
        : undefined,
    });

    const body = await parseActionResponse(response);
    if (!response.ok || !body.ok || !body.detail) {
      setError(body.error || "Unable to run review action.");
      setLoadingState(undefined);
      return;
    }

    setDetail(body.detail);
    setMessage(
      action === "approve"
        ? "Approved and marked publish-ready."
        : action === "regenerate"
          ? "Regeneration completed."
          : action === "needs_changes"
            ? "Marked as needs changes."
            : "Rejected and blocked from publish readiness.",
    );
    setLoadingState(undefined);
  }

  async function saveInline(): Promise<void> {
    setLoadingState("save");
    setError(undefined);
    setMessage(undefined);

    const response = await fetch(`/api/review/${encodeURIComponent(detail.contentId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewNote: note,
        socialTitle: detail.canInlineEditContent ? socialTitle : undefined,
      }),
    });

    const body = await parseActionResponse(response);
    if (!response.ok || !body.ok || !body.detail) {
      const validationMessage = body.validationErrors?.length
        ? `${body.error || "Invalid inline edit"}: ${body.validationErrors.join(", ")}`
        : body.error || "Unable to save inline edits.";
      setError(validationMessage);
      setLoadingState(undefined);
      return;
    }

    setDetail(body.detail);
    setSocialTitle(body.detail.item.title);
    setNote(body.detail.reviewNote ?? note);
    setMessage("Inline edits saved.");
    setLoadingState(undefined);
  }

  return (
    <section className="review-action-bar" aria-label="Review actions">
      <div className="review-action-header">
        <ReviewStatusBadge state={detail.reviewState as ReviewState} />
        <p>{detail.publishReady ? "Publish ready" : "Publish blocked until approved"}</p>
      </div>

      {error ? <p className="review-action-error">{error}</p> : null}
      {message ? <p className="review-action-success">{message}</p> : null}

      <div className="review-action-controls">
        <button type="button" onClick={() => void runAction("approve")} disabled={Boolean(loadingState)}>
          {loadingState === "approve" ? "Approving..." : "Approve"}
        </button>
        <button type="button" onClick={() => void runAction("needs_changes")} disabled={Boolean(loadingState)}>
          {loadingState === "needs_changes" ? "Updating..." : "Needs changes"}
        </button>
        <button type="button" onClick={() => void runAction("reject")} disabled={Boolean(loadingState)}>
          {loadingState === "reject" ? "Rejecting..." : "Reject"}
        </button>
        <button type="button" onClick={() => void runAction("regenerate")} disabled={Boolean(loadingState)}>
          {loadingState === "regenerate" ? "Regenerating..." : "Regenerate"}
        </button>
        {detail.editHref ? <Link href={detail.editHref}>Open existing editor</Link> : null}
      </div>

      <div className="review-inline-edit">
        <label>
          Feedback note
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Add reviewer feedback or publishing context"
          />
        </label>

        {detail.canInlineEditContent ? (
          <label>
            Social post title (inline edit)
            <input value={socialTitle} onChange={(event) => setSocialTitle(event.target.value)} />
          </label>
        ) : null}

        <button type="button" onClick={() => void saveInline()} disabled={Boolean(loadingState)}>
          {loadingState === "save" ? "Saving..." : "Save inline edits"}
        </button>
      </div>
    </section>
  );
}

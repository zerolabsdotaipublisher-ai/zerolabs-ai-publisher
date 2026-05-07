"use client";

import Link from "next/link";
import { useState } from "react";
import type { ApprovalDetail } from "@/lib/approval/types";
import { ApprovalStatusBadge } from "./approval-status-badge";

interface ApprovalActionBarProps {
  initialDetail: ApprovalDetail;
}

interface ApprovalActionResponse {
  ok: boolean;
  detail?: ApprovalDetail;
  error?: string;
}

async function parseActionResponse(response: Response): Promise<ApprovalActionResponse> {
  try {
    return (await response.json()) as ApprovalActionResponse;
  } catch {
    return { ok: false, error: "Unexpected API response format." };
  }
}

export function ApprovalActionBar({ initialDetail }: ApprovalActionBarProps) {
  const [detail, setDetail] = useState(initialDetail);
  const [note, setNote] = useState("");
  const [loadingAction, setLoadingAction] = useState<string>();
  const [error, setError] = useState<string>();
  const [message, setMessage] = useState<string>();

  async function runAction(action: "submit" | "approve" | "reject" | "request-changes"): Promise<void> {
    setLoadingAction(action);
    setError(undefined);
    setMessage(undefined);

    const endpoint = `/api/approval/${encodeURIComponent(detail.contentId)}/${action}`;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note.trim() || undefined }),
    });

    const body = await parseActionResponse(response);
    if (!response.ok || !body.ok || !body.detail) {
      setError(body.error || "Unable to run approval action.");
      setLoadingAction(undefined);
      return;
    }

    setDetail(body.detail);
    setMessage(
      action === "submit"
        ? "Submitted for approval."
        : action === "approve"
          ? "Approved and publish-ready."
          : action === "request-changes"
            ? "Changes requested."
            : "Rejected.",
    );
    setLoadingAction(undefined);
  }

  return (
    <section className="review-action-bar" aria-label="Approval actions">
      <div className="review-action-header">
        <ApprovalStatusBadge state={detail.approvalState} />
        <p>{detail.publishReady ? "Publish ready" : "Publish blocked until approved"}</p>
      </div>

      {error ? <p className="review-action-error">{error}</p> : null}
      {message ? <p className="review-action-success">{message}</p> : null}

      <label>
        Decision note
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional decision context"
        />
      </label>

      <div className="review-action-controls">
        <button type="button" onClick={() => void runAction("submit")} disabled={Boolean(loadingAction) || !detail.submitReady}>
          {loadingAction === "submit" ? "Submitting..." : "Submit for approval"}
        </button>
        <button type="button" onClick={() => void runAction("approve")} disabled={Boolean(loadingAction)}>
          {loadingAction === "approve" ? "Approving..." : "Approve"}
        </button>
        <button type="button" onClick={() => void runAction("request-changes")} disabled={Boolean(loadingAction)}>
          {loadingAction === "request-changes" ? "Saving..." : "Request changes"}
        </button>
        <button type="button" onClick={() => void runAction("reject")} disabled={Boolean(loadingAction)}>
          {loadingAction === "reject" ? "Rejecting..." : "Reject"}
        </button>
        <Link href={detail.reviewHref}>Open review detail</Link>
        {detail.editHref ? <Link href={detail.editHref}>Open editor</Link> : null}
        {detail.previewHref ? <Link href={detail.previewHref}>Preview</Link> : null}
      </div>

      <section className="review-future-ready" aria-label="Approval multi-level readiness">
        <h3>Future-ready multi-level approvals</h3>
        <p>{detail.notes.multilevel}</p>
      </section>
    </section>
  );
}

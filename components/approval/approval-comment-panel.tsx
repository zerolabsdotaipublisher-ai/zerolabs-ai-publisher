"use client";

import { useState } from "react";
import type { ApprovalDetail } from "@/lib/approval/types";
import { ApprovalFeedbackThread } from "./approval-feedback-thread";

interface ApprovalCommentPanelProps {
  initialDetail: ApprovalDetail;
}

interface ApprovalActionResponse {
  ok: boolean;
  detail?: ApprovalDetail;
  error?: string;
}

export function ApprovalCommentPanel({ initialDetail }: ApprovalCommentPanelProps) {
  const [detail, setDetail] = useState(initialDetail);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  async function submitComment() {
    setSaving(true);
    setError(undefined);

    try {
      const response = await fetch(`/api/approval/${encodeURIComponent(detail.contentId)}/comment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: comment }),
      });
      const body = (await response.json()) as ApprovalActionResponse;
      if (!response.ok || !body.ok || !body.detail) {
        setError(body.error || "Unable to add feedback comment.");
        return;
      }

      setDetail(body.detail);
      setComment("");
    } catch {
      setError("Unable to add feedback comment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="review-action-bar" aria-label="Approval comments and feedback">
      <h2>Comments and feedback</h2>
      {error ? <p className="review-action-error">{error}</p> : null}

      <label>
        Add feedback
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="Share approval feedback, requested changes, or decision context"
        />
      </label>

      <button type="button" onClick={() => void submitComment()} disabled={saving || !comment.trim()}>
        {saving ? "Posting..." : "Post comment"}
      </button>

      <ApprovalFeedbackThread comments={detail.comments} />
    </section>
  );
}

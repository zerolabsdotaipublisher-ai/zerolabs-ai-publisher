import type { ApprovalComment } from "@/lib/approval";

interface ApprovalFeedbackThreadProps {
  comments: ApprovalComment[];
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export function ApprovalFeedbackThread({ comments }: ApprovalFeedbackThreadProps) {
  if (comments.length === 0) {
    return <p>No feedback comments yet.</p>;
  }

  return (
    <ul className="review-metadata-panel">
      {comments.map((comment) => (
        <li key={comment.id}>
          <p><strong>{comment.authorRole}</strong> · {formatDate(comment.createdAt)}</p>
          <p>{comment.body}</p>
        </li>
      ))}
    </ul>
  );
}

interface LiveLinkCardProps {
  liveUrl?: string;
  lastPublishedAt?: string;
  lastDraftUpdatedAt?: string;
}

function formatDate(value?: string): string {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function LiveLinkCard({ liveUrl, lastPublishedAt, lastDraftUpdatedAt }: LiveLinkCardProps) {
  if (!liveUrl && !lastPublishedAt && !lastDraftUpdatedAt) {
    return null;
  }

  return (
    <section className="publish-live-link-card" aria-label="Live website details">
      {liveUrl ? (
        <p>
          Live URL: <a href={liveUrl}>{liveUrl}</a>
        </p>
      ) : null}
      <p>Last published: {formatDate(lastPublishedAt)}</p>
      <p>Last draft update: {formatDate(lastDraftUpdatedAt)}</p>
    </section>
  );
}

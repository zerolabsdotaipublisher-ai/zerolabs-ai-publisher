import type { ReviewDetail } from "@/lib/review/types";

interface ReviewContentPreviewProps {
  detail: ReviewDetail;
}

export function ReviewContentPreview({ detail }: ReviewContentPreviewProps) {
  if (detail.preview.socialPreview) {
    return (
      <section className="review-preview" aria-label="Social preview">
        <h2>Social preview</h2>
        <div className="social-preview-grid">
          {detail.preview.socialPreview.cards.map((card) => (
            <article key={card.platform} className="social-preview-card">
              <h3>{card.platform.toUpperCase()}</h3>
              <p>{card.caption}</p>
              {card.hashtagsLine ? <p>{card.hashtagsLine}</p> : null}
              <p>{card.callToAction}</p>
              {card.link ? <p>{card.link}</p> : null}
            </article>
          ))}
        </div>
      </section>
    );
  }

  if (!detail.preview.websitePreviewHref) {
    return (
      <section className="review-preview" aria-label="Content preview unavailable">
        <h2>Preview</h2>
        <p>Preview is unavailable for this item.</p>
      </section>
    );
  }

  return (
    <section className="review-preview" aria-label="Website preview">
      <h2>Preview</h2>
      <iframe
        className="review-preview-frame"
        src={detail.preview.websitePreviewHref}
        title={`${detail.item.title} preview`}
        loading="lazy"
      />
    </section>
  );
}

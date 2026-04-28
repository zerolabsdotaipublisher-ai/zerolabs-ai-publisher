import type { SocialPreviewResponse } from "@/lib/social";

interface SocialPostPreviewProps {
  preview: SocialPreviewResponse;
}

export function SocialPostPreview({ preview }: SocialPostPreviewProps) {
  return (
    <section className="wizard-step-panel" aria-live="polite">
      <h2>Social post preview</h2>
      <p>{preview.socialPost.title}</p>
      <div className="social-preview-grid">
        {preview.cards.map((card) => (
          <article key={card.platform} className="social-preview-card">
            <h3>{card.platform.toUpperCase()}</h3>
            <p>{card.caption}</p>
            {card.hashtagsLine ? <p>{card.hashtagsLine}</p> : null}
            <p>{card.callToAction}</p>
            {card.link ? <p>{card.link}</p> : null}
            <p>
              {card.characterCount}/{card.characterLimit} characters
            </p>
            {card.warnings.length > 0 ? (
              <ul>
                {card.warnings.map((warning) => (
                  <li key={`${card.platform}-${warning}`}>{warning}</li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

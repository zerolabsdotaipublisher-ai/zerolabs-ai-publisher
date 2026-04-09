import type { WebsiteWizardInput, WizardStepId } from "@/lib/wizard";

interface WizardReviewProps {
  data: WebsiteWizardInput;
  onEditStep: (stepId: WizardStepId) => void;
  onGenerate: () => void;
  isSubmitting: boolean;
}

function renderList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "Not provided";
}

export function WizardReview({ data, onEditStep, onGenerate, isSubmitting }: WizardReviewProps) {
  return (
    <section className="wizard-step-panel">
      <h2>Review and confirm</h2>
      <p className="wizard-step-description">
        Review your inputs before running structure, content, navigation, and SEO generation.
      </p>

      <div className="wizard-review-grid">
        <article>
          <h3>Website type</h3>
          <p>{data.websiteType}</p>
          <button type="button" className="wizard-button-link" onClick={() => onEditStep("website-type")}>
            Edit
          </button>
        </article>

        <article>
          <h3>Business info</h3>
          <p>
            <strong>{data.brandName || "Not provided"}</strong>
          </p>
          <p>{data.description || "Not provided"}</p>
          <p>Audience: {data.targetAudience || "Not provided"}</p>
          <p>Services: {renderList(data.services)}</p>
          <p>CTA: {data.primaryCta || "Not provided"}</p>
          <button type="button" className="wizard-button-link" onClick={() => onEditStep("business-info")}>
            Edit
          </button>
        </article>

        <article>
          <h3>Style and tone</h3>
          <p>Style: {data.style}</p>
          <p>Tone: {data.tone}</p>
          {data.customStyleNotes ? <p>Custom style notes: {data.customStyleNotes}</p> : null}
          {data.customToneNotes ? <p>Custom tone notes: {data.customToneNotes}</p> : null}
          <button type="button" className="wizard-button-link" onClick={() => onEditStep("style-theme")}>
            Edit
          </button>
        </article>

        <article>
          <h3>Optional content</h3>
          <p>Founder: {data.founderProfile.name || "Not provided"}</p>
          <p>Testimonials: {data.testimonials.length}</p>
          <p>Contact email: {data.contactInfo.email || "Not provided"}</p>
          <p>Constraints: {renderList(data.constraints)}</p>
          <button type="button" className="wizard-button-link" onClick={() => onEditStep("content-input")}>
            Edit
          </button>
        </article>
      </div>

      <button type="button" onClick={onGenerate} disabled={isSubmitting}>
        {isSubmitting ? "Starting generation…" : "Generate website"}
      </button>
    </section>
  );
}

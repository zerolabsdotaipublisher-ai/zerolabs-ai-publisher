import {
  fontFamilyOptions,
  layoutStructureOptions,
  type WebsiteWizardInput,
  type WizardStepId,
} from "@/lib/wizard";

interface WizardReviewProps {
  data: WebsiteWizardInput;
  onEditStep: (stepId: WizardStepId) => void;
  onGenerate: () => void;
  isSubmitting: boolean;
}

function renderList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "Not provided";
}

function findLayoutLabel(value: string): string {
  return layoutStructureOptions.find((option) => option.value === value)?.label ?? value;
}

function findFontLabel(value: string): string {
  return fontFamilyOptions.find((option) => option.value === value)?.label ?? value;
}

function renderBackgroundSummary(
  background: WebsiteWizardInput["designConfig"]["pages"][number]["background"],
): string {
  switch (background.type) {
    case "solid":
      return `Solid ${background.primaryColor}`;
    case "blend":
      return `Blend ${background.primaryColor} to ${background.secondaryColor ?? "not set"}`;
    case "gradient":
      return `Gradient ${background.gradientDirection ?? "direction"} from ${background.primaryColor} to ${background.secondaryColor ?? "not set"}`;
    case "image":
      return `Image background (${background.imageUrl || "URL not set"})`;
    case "video":
      return `Video background (${background.videoUrl || "URL not set"})`;
    default:
      return "Not provided";
  }
}

export function WizardReview({ data, onEditStep, onGenerate, isSubmitting }: WizardReviewProps) {
  return (
    <section className="wizard-step-panel">
      <h2>Review and confirm</h2>
      <p className="wizard-step-description">
        Review the page plan and brand inputs before running structure, content, navigation, and SEO generation.
      </p>

      <div className="wizard-review-grid">
        <article>
          <h3>Pages setup</h3>
          <p>Total pages: {data.designConfig.pages.length}</p>
          <p>
            Page names: {data.designConfig.pages.map((page) => page.name).join(", ")}
          </p>
          <button type="button" className="wizard-button-link" onClick={() => onEditStep("page-setup")}>
            Edit
          </button>
        </article>

        <article>
          <h3>Brand and generation inputs</h3>
          <p>
            <strong>{data.brandName || "Not provided"}</strong>
          </p>
          <p>{data.description || "Not provided"}</p>
          <p>Audience: {data.targetAudience || "Not provided"}</p>
          <p>Services: {renderList(data.services)}</p>
          <p>CTA: {data.primaryCta || "Not provided"}</p>
          <p>Style: {data.style}</p>
          <p>Tone: {data.tone}</p>
          <button type="button" className="wizard-button-link" onClick={() => onEditStep("brand-content")}>
            Edit
          </button>
        </article>

        <article>
          <h3>Supporting content</h3>
          <p>Founder: {data.founderProfile.name || "Not provided"}</p>
          <p>Contact email: {data.contactInfo.email || "Not provided"}</p>
          <p>Constraints: {renderList(data.constraints)}</p>
          <button type="button" className="wizard-button-link" onClick={() => onEditStep("brand-content")}>
            Edit
          </button>
        </article>

        <article>
          <h3>Generation compatibility</h3>
          <p>Inferred website type: {data.websiteType}</p>
          <p>
            Primary page: {data.designConfig.pages[0]?.name || "Not provided"} /{" "}
            {findLayoutLabel(data.designConfig.pages[0]?.layout || "hero-sections")}
          </p>
          <button type="button" className="wizard-button-link" onClick={() => onEditStep("page-design")}>
            Edit
          </button>
        </article>
      </div>

      <div className="wizard-pages-grid">
        {data.designConfig.pages.map((page) => (
          <article key={page.id} className="wizard-page-card wizard-review-page-card">
            <h3>{page.name}</h3>
            <p>Layout: {findLayoutLabel(page.layout)}</p>
            <p>Background: {renderBackgroundSummary(page.background)}</p>
            <p>
              Typography: {findFontLabel(page.typography.bodyFont)}, {page.typography.fontMood},{" "}
              {page.typography.fontSizePreference}
            </p>
            <p>
              Headings: {findFontLabel(page.headings.headingFont)}, {page.headings.headingScale},{" "}
              {page.headings.headingWeight} weight
            </p>
            <p>Content prompt: {page.contentPrompt}</p>
          </article>
        ))}
      </div>

      <div className="wizard-navigation-actions">
        <button
          type="button"
          className="wizard-button-secondary"
          onClick={() => onEditStep("page-design")}
        >
          Edit page designs
        </button>
        <button type="button" onClick={onGenerate} disabled={isSubmitting}>
          {isSubmitting ? "Starting generation..." : "Generate website"}
        </button>
      </div>
    </section>
  );
}

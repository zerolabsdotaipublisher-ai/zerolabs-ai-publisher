import { StepBusinessInfo } from "@/components/wizard/steps/step-business-info";
import { StepContentInput } from "@/components/wizard/steps/step-content-input";
import { StepStyleTheme } from "@/components/wizard/steps/step-style-theme";
import { StepWebsiteType } from "@/components/wizard/steps/step-website-type";
import type { WebsiteWizardInput } from "@/lib/wizard";

interface GenerationInputPanelProps {
  data: WebsiteWizardInput;
  servicesText: string;
  testimonialsText: string;
  socialLinksText: string;
  constraintsText: string;
  errors: string[];
  isEditing: boolean;
  onFieldChange: (patch: Partial<WebsiteWizardInput>) => void;
  onServicesTextChange: (value: string) => void;
  onTestimonialsChange: (value: string) => void;
  onSocialLinksChange: (value: string) => void;
  onConstraintsChange: (value: string) => void;
}

export function GenerationInputPanel({
  data,
  servicesText,
  testimonialsText,
  socialLinksText,
  constraintsText,
  errors,
  isEditing,
  onFieldChange,
  onServicesTextChange,
  onTestimonialsChange,
  onSocialLinksChange,
  onConstraintsChange,
}: GenerationInputPanelProps) {
  return (
    <section className="generation-panel" aria-labelledby="generation-inputs-title">
      <h2 id="generation-inputs-title">Generation inputs</h2>

      {errors.length > 0 ? (
        <div className="wizard-error" role="alert" aria-live="assertive">
          {errors.map((error) => (
            <p key={error}>{error}</p>
          ))}
        </div>
      ) : null}

      <div aria-disabled={!isEditing} className={!isEditing ? "generation-readonly" : undefined}>
        <StepWebsiteType
          value={data.websiteType}
          onChange={(value) => (isEditing ? onFieldChange({ websiteType: value }) : undefined)}
        />
        <StepBusinessInfo
          data={data}
          servicesText={servicesText}
          onFieldChange={(patch) => (isEditing ? onFieldChange(patch) : undefined)}
          onServicesTextChange={(value) => (isEditing ? onServicesTextChange(value) : undefined)}
        />
        <StepStyleTheme
          data={data}
          onFieldChange={(patch) => (isEditing ? onFieldChange(patch) : undefined)}
        />
        <StepContentInput
          data={data}
          testimonialsText={testimonialsText}
          socialLinksText={socialLinksText}
          constraintsText={constraintsText}
          onFieldChange={(patch) => (isEditing ? onFieldChange(patch) : undefined)}
          onTestimonialsChange={(value) => (isEditing ? onTestimonialsChange(value) : undefined)}
          onSocialLinksChange={(value) => (isEditing ? onSocialLinksChange(value) : undefined)}
          onConstraintsChange={(value) => (isEditing ? onConstraintsChange(value) : undefined)}
        />
      </div>
    </section>
  );
}

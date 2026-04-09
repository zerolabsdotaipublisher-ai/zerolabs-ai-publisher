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
  function runIfEditing<T>(handler: (value: T) => void, value: T) {
    if (!isEditing) {
      return;
    }

    handler(value);
  }

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

      <fieldset
        disabled={!isEditing}
        className={`generation-input-fieldset ${!isEditing ? "generation-readonly" : ""}`.trim()}
      >
        <StepWebsiteType
          value={data.websiteType}
          onChange={(value) => runIfEditing(onFieldChange, { websiteType: value })}
        />
        <StepBusinessInfo
          data={data}
          servicesText={servicesText}
          onFieldChange={(patch) => runIfEditing(onFieldChange, patch)}
          onServicesTextChange={(value) => runIfEditing(onServicesTextChange, value)}
        />
        <StepStyleTheme
          data={data}
          onFieldChange={(patch) => runIfEditing(onFieldChange, patch)}
        />
        <StepContentInput
          data={data}
          testimonialsText={testimonialsText}
          socialLinksText={socialLinksText}
          constraintsText={constraintsText}
          onFieldChange={(patch) => runIfEditing(onFieldChange, patch)}
          onTestimonialsChange={(value) => runIfEditing(onTestimonialsChange, value)}
          onSocialLinksChange={(value) => runIfEditing(onSocialLinksChange, value)}
          onConstraintsChange={(value) => runIfEditing(onConstraintsChange, value)}
        />
      </fieldset>
    </section>
  );
}

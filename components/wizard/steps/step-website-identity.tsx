import {
  buildWebsiteIdentityPatch,
  getWebsiteIdentityValue,
  type WebsiteWizardInput,
  type WebsiteWizardInputPatch,
} from "@/lib/wizard";

interface StepWebsiteIdentityProps {
  data: WebsiteWizardInput;
  errors?: string[];
  onFieldChange: (patch: WebsiteWizardInputPatch) => void;
}

export function StepWebsiteIdentity({
  data,
  errors = [],
  onFieldChange,
}: StepWebsiteIdentityProps) {
  return (
    <section className="wizard-step-panel">
      <h2>Website identity</h2>
      <p className="wizard-step-description">
        Enter a website name or domain.
      </p>

      <label>
        <span>Website name or domain</span>
        <input
          type="text"
          value={getWebsiteIdentityValue(data)}
          onChange={(event) => onFieldChange(buildWebsiteIdentityPatch(event.target.value))}
          placeholder="Example: acmestudio.com"
          aria-invalid={errors.length > 0 ? true : undefined}
          aria-describedby="wizard-website-identity-hint"
          spellCheck={false}
        />
        <span className="wizard-field-hint" id="wizard-website-identity-hint">
          Enter your website name or preferred domain. You can leave this blank and edit it later.
        </span>
      </label>
    </section>
  );
}

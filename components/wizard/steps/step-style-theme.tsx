import { styleOptions, toneOptions } from "@/lib/wizard";
import type { WebsiteWizardInput, WebsiteWizardInputPatch } from "@/lib/wizard";

interface StepStyleThemeProps {
  data: WebsiteWizardInput;
  onFieldChange: (patch: WebsiteWizardInputPatch) => void;
}

export function StepStyleTheme({ data, onFieldChange }: StepStyleThemeProps) {
  return (
    <section className="wizard-step-panel">
      <h2>Style and tone</h2>
      <p className="wizard-step-description">
        Choose the voice and broader creative direction that should shape structure, content, and SEO.
      </p>

      <fieldset>
        <legend>Style preference *</legend>
        <div className="wizard-choice-grid compact">
          {styleOptions.map((option) => {
            const isSelected = data.style === option.value;

            return (
              <label key={option.value} className={`wizard-choice-card${isSelected ? " is-selected" : ""}`}>
                <input
                  type="radio"
                  name="style"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => onFieldChange({ style: option.value })}
                />
                <span className="wizard-choice-title">{option.label}</span>
                {isSelected ? <span className="wizard-choice-state">Selected</span> : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      {data.style === "custom" ? (
        <label>
          Custom style notes *
          <textarea
            value={data.customStyleNotes}
            onChange={(event) => onFieldChange({ customStyleNotes: event.target.value })}
            rows={3}
            placeholder="Describe colors, spacing, typography, and visual references"
            required
          />
        </label>
      ) : null}

      <fieldset>
        <legend>Tone preference *</legend>
        <div className="wizard-choice-grid compact">
          {toneOptions.map((option) => {
            const isSelected = data.tone === option.value;

            return (
              <label key={option.value} className={`wizard-choice-card${isSelected ? " is-selected" : ""}`}>
                <input
                  type="radio"
                  name="tone"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => onFieldChange({ tone: option.value })}
                />
                <span className="wizard-choice-title">{option.label}</span>
                {isSelected ? <span className="wizard-choice-state">Selected</span> : null}
              </label>
            );
          })}
        </div>
      </fieldset>

      {data.tone === "custom" ? (
        <label>
          Custom tone notes *
          <textarea
            value={data.customToneNotes}
            onChange={(event) => onFieldChange({ customToneNotes: event.target.value })}
            rows={3}
            placeholder="Describe how copy should feel"
            required
          />
        </label>
      ) : null}
    </section>
  );
}

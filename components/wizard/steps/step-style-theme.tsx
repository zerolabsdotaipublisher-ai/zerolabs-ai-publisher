import { styleOptions, toneOptions } from "@/lib/wizard";
import type { WebsiteWizardInput } from "@/lib/wizard";

interface StepStyleThemeProps {
  data: WebsiteWizardInput;
  onFieldChange: (patch: Partial<WebsiteWizardInput>) => void;
}

export function StepStyleTheme({ data, onFieldChange }: StepStyleThemeProps) {
  return (
    <section className="wizard-step-panel">
      <h2>Style and theme</h2>
      <p className="wizard-step-description">
        Choose the visual and voice direction that should shape structure, layout, content, and SEO.
      </p>

      <fieldset>
        <legend>Style preference *</legend>
        <div className="wizard-choice-grid compact">
          {styleOptions.map((option) => (
            <label key={option.value} className="wizard-choice-card">
              <input
                type="radio"
                name="style"
                value={option.value}
                checked={data.style === option.value}
                onChange={() => onFieldChange({ style: option.value })}
              />
              <span className="wizard-choice-title">{option.label}</span>
            </label>
          ))}
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
          {toneOptions.map((option) => (
            <label key={option.value} className="wizard-choice-card">
              <input
                type="radio"
                name="tone"
                value={option.value}
                checked={data.tone === option.value}
                onChange={() => onFieldChange({ tone: option.value })}
              />
              <span className="wizard-choice-title">{option.label}</span>
            </label>
          ))}
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

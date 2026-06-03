import { styleOptions, toneOptions } from "@/lib/wizard";
import type { WebsiteWizardInput, WebsiteWizardInputPatch } from "@/lib/wizard";

interface StepStyleThemeProps {
  data: WebsiteWizardInput;
  errors?: string[];
  onFieldChange: (patch: WebsiteWizardInputPatch) => void;
}

export function StepStyleTheme({
  data,
  errors = [],
  onFieldChange,
}: StepStyleThemeProps) {
  const styleError = errors.includes("Select a style preference.");
  const toneError = errors.includes("Select a tone preference.");
  const customStyleNotesError = errors.includes("Add custom style notes when style is set to custom.");
  const customToneNotesError = errors.includes("Add custom tone notes when tone is set to custom.");

  return (
    <section className="wizard-step-panel">
      <h2>Style and tone</h2>
      <p className="wizard-step-description">
        Choose the voice and broader creative direction that should shape structure, content, and SEO.
      </p>

      <fieldset>
        <legend>Style preference *</legend>
        <p className="wizard-field-hint">
          Choose the overall art direction that should guide layout, copy, and SEO decisions.
        </p>
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
        {styleError ? <p className="wizard-field-error">Select a style preference.</p> : null}
      </fieldset>

      {data.style === "custom" ? (
        <label>
          <span>Custom style notes *</span>
          <textarea
            value={data.customStyleNotes}
            onChange={(event) => onFieldChange({ customStyleNotes: event.target.value })}
            rows={3}
            placeholder="Describe colors, spacing, typography, and visual references"
            aria-invalid={customStyleNotesError || undefined}
            aria-describedby={customStyleNotesError ? "wizard-custom-style-notes-error" : undefined}
            required
          />
          {customStyleNotesError ? (
            <span className="wizard-field-error" id="wizard-custom-style-notes-error">
              Add custom style notes when style is set to custom.
            </span>
          ) : null}
        </label>
      ) : null}

      <fieldset>
        <legend>Tone preference *</legend>
        <p className="wizard-field-hint">
          Choose the voice that should shape headlines, body copy, and calls to action.
        </p>
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
        {toneError ? <p className="wizard-field-error">Select a tone preference.</p> : null}
      </fieldset>

      {data.tone === "custom" ? (
        <label>
          <span>Custom tone notes *</span>
          <textarea
            value={data.customToneNotes}
            onChange={(event) => onFieldChange({ customToneNotes: event.target.value })}
            rows={3}
            placeholder="Describe how copy should feel"
            aria-invalid={customToneNotesError || undefined}
            aria-describedby={customToneNotesError ? "wizard-custom-tone-notes-error" : undefined}
            required
          />
          {customToneNotesError ? (
            <span className="wizard-field-error" id="wizard-custom-tone-notes-error">
              Add custom tone notes when tone is set to custom.
            </span>
          ) : null}
        </label>
      ) : null}
    </section>
  );
}

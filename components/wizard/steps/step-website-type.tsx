import { websiteTypeOptions } from "@/lib/wizard";
import type { WebsiteType } from "@/lib/ai/prompts/types";

interface StepWebsiteTypeProps {
  value: WebsiteType;
  onChange: (value: WebsiteType) => void;
}

export function StepWebsiteType({ value, onChange }: StepWebsiteTypeProps) {
  return (
    <fieldset className="wizard-step-panel">
      <legend>What type of website are you creating?</legend>
      <p className="wizard-step-description">
        This decides baseline structure and generation strategy for the existing AI pipeline.
      </p>
      <div className="wizard-choice-grid">
        {websiteTypeOptions.map((option) => (
          <label key={option.value} className="wizard-choice-card">
            <input
              type="radio"
              name="websiteType"
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span className="wizard-choice-title">{option.label}</span>
            <span>{option.description}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

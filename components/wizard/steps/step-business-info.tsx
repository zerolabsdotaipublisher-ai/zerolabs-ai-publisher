import type { WebsiteWizardInput } from "@/lib/wizard";

interface StepBusinessInfoProps {
  data: WebsiteWizardInput;
  servicesText: string;
  onFieldChange: (patch: Partial<WebsiteWizardInput>) => void;
  onServicesTextChange: (value: string) => void;
}

export function StepBusinessInfo({
  data,
  servicesText,
  onFieldChange,
  onServicesTextChange,
}: StepBusinessInfoProps) {
  return (
    <section className="wizard-step-panel">
      <h2>Business and brand details</h2>
      <p className="wizard-step-description">Required fields are marked with *.</p>

      <label>
        Brand or business name *
        <input
          type="text"
          value={data.brandName}
          onChange={(event) => onFieldChange({ brandName: event.target.value })}
          placeholder="Acme Studio"
          required
        />
      </label>

      <label>
        Short description *
        <textarea
          value={data.description}
          onChange={(event) => onFieldChange({ description: event.target.value })}
          placeholder="What you do and the value you provide"
          rows={3}
          required
        />
      </label>

      <label>
        Target audience *
        <input
          type="text"
          value={data.targetAudience}
          onChange={(event) => onFieldChange({ targetAudience: event.target.value })}
          placeholder="Startup founders and growth teams"
          required
        />
      </label>

      <label>
        Services or offers * (one per line)
        <textarea
          value={servicesText}
          onChange={(event) => onServicesTextChange(event.target.value)}
          placeholder={"Brand strategy\nWebsite design\nConversion optimization"}
          rows={4}
          required
        />
      </label>

      <label>
        Primary call-to-action *
        <input
          type="text"
          value={data.primaryCta}
          onChange={(event) => onFieldChange({ primaryCta: event.target.value })}
          placeholder="Book a strategy call"
          required
        />
      </label>
    </section>
  );
}

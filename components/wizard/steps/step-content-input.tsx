import type { WebsiteWizardInput, WebsiteWizardInputPatch } from "@/lib/wizard";

interface StepContentInputProps {
  data: WebsiteWizardInput;
  socialLinksText: string;
  constraintsText: string;
  errors?: string[];
  onFieldChange: (patch: WebsiteWizardInputPatch) => void;
  onSocialLinksChange: (value: string) => void;
  onConstraintsChange: (value: string) => void;
}

export function StepContentInput({
  data,
  socialLinksText,
  constraintsText,
  errors = [],
  onFieldChange,
  onSocialLinksChange,
  onConstraintsChange,
}: StepContentInputProps) {
  const emailError = errors.includes("Contact email must be a valid email address.");

  return (
    <section className="wizard-step-panel">
      <h2>Content and customization (optional)</h2>
      <p className="wizard-step-description">
        You can skip this step and generate with required inputs only.
      </p>

      <div className="wizard-columns">
        <label>
          <span>Founder name</span>
          <input
            type="text"
            value={data.founderProfile.name ?? ""}
            onChange={(event) =>
              onFieldChange({ founderProfile: { ...data.founderProfile, name: event.target.value } })
            }
          />
        </label>

        <label>
          <span>Founder role</span>
          <input
            type="text"
            value={data.founderProfile.role ?? ""}
            onChange={(event) =>
              onFieldChange({ founderProfile: { ...data.founderProfile, role: event.target.value } })
            }
          />
        </label>
      </div>

      <label>
        <span>Founder bio</span>
        <textarea
          value={data.founderProfile.bio ?? ""}
          onChange={(event) =>
            onFieldChange({ founderProfile: { ...data.founderProfile, bio: event.target.value } })
          }
          rows={3}
        />
      </label>

      <div className="wizard-columns">
        <label>
          <span>Contact email</span>
          <input
            type="email"
            value={data.contactInfo.email ?? ""}
            onChange={(event) =>
              onFieldChange({ contactInfo: { ...data.contactInfo, email: event.target.value } })
            }
            placeholder="hello@example.com"
            aria-invalid={emailError || undefined}
            aria-describedby={emailError ? "wizard-contact-email-error" : undefined}
          />
          {emailError ? (
            <span className="wizard-field-error" id="wizard-contact-email-error">
              Contact email must be a valid email address.
            </span>
          ) : null}
        </label>

        <label>
          <span>Contact phone</span>
          <input
            type="text"
            value={data.contactInfo.phone ?? ""}
            onChange={(event) =>
              onFieldChange({ contactInfo: { ...data.contactInfo, phone: event.target.value } })
            }
            placeholder="+1 555 0100"
          />
        </label>
      </div>

      <label>
        <span>Location</span>
        <input
          type="text"
          value={data.contactInfo.location ?? ""}
          onChange={(event) =>
            onFieldChange({ contactInfo: { ...data.contactInfo, location: event.target.value } })
          }
          placeholder="Austin, TX"
        />
      </label>

      <label>
        <span>Social links (one per line)</span>
        <textarea
          value={socialLinksText}
          onChange={(event) => onSocialLinksChange(event.target.value)}
          rows={3}
          placeholder={"https://linkedin.com/in/example\nhttps://instagram.com/example"}
        />
        <span className="wizard-field-hint">
          Include only full public URLs that should appear in the generated website.
        </span>
      </label>

      <label>
        <span>Content constraints (one per line)</span>
        <textarea
          value={constraintsText}
          onChange={(event) => onConstraintsChange(event.target.value)}
          rows={3}
          placeholder={"Avoid jargon\nKeep claims evidence-based"}
        />
        <span className="wizard-field-hint">
          Use this for guardrails such as banned claims, legal notes, or brand language constraints.
        </span>
      </label>
    </section>
  );
}

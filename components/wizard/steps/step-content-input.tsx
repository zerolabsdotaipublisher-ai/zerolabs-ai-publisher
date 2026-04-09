import type { TestimonialInput } from "@/lib/ai/prompts/types";
import type { WebsiteWizardInput } from "@/lib/wizard";

interface StepContentInputProps {
  data: WebsiteWizardInput;
  testimonialsText: string;
  socialLinksText: string;
  constraintsText: string;
  onFieldChange: (patch: Partial<WebsiteWizardInput>) => void;
  onTestimonialsChange: (value: string) => void;
  onSocialLinksChange: (value: string) => void;
  onConstraintsChange: (value: string) => void;
}

function testimonialHint(testimonials: TestimonialInput[]): string {
  if (!testimonials.length) {
    return "Optional. Format: quote | author | role (escape pipe with \\|)";
  }

  return `${testimonials.length} testimonial entr${testimonials.length === 1 ? "y" : "ies"} parsed`;
}

export function StepContentInput({
  data,
  testimonialsText,
  socialLinksText,
  constraintsText,
  onFieldChange,
  onTestimonialsChange,
  onSocialLinksChange,
  onConstraintsChange,
}: StepContentInputProps) {
  return (
    <section className="wizard-step-panel">
      <h2>Content and customization (optional)</h2>
      <p className="wizard-step-description">
        You can skip this step and generate with required inputs only.
      </p>

      <div className="wizard-columns">
        <label>
          Founder name
          <input
            type="text"
            value={data.founderProfile.name ?? ""}
            onChange={(event) =>
              onFieldChange({ founderProfile: { ...data.founderProfile, name: event.target.value } })
            }
          />
        </label>

        <label>
          Founder role
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
        Founder bio
        <textarea
          value={data.founderProfile.bio ?? ""}
          onChange={(event) =>
            onFieldChange({ founderProfile: { ...data.founderProfile, bio: event.target.value } })
          }
          rows={3}
        />
      </label>

      <label>
        Testimonials
        <textarea
          value={testimonialsText}
          onChange={(event) => onTestimonialsChange(event.target.value)}
          rows={4}
          placeholder={"They delivered incredible ROI | Alex Chen | Founder\nA seamless process | Dana Park | Marketing Lead"}
        />
        <span className="wizard-field-hint">{testimonialHint(data.testimonials)}</span>
      </label>

      <div className="wizard-columns">
        <label>
          Contact email
          <input
            type="email"
            value={data.contactInfo.email ?? ""}
            onChange={(event) =>
              onFieldChange({ contactInfo: { ...data.contactInfo, email: event.target.value } })
            }
            placeholder="hello@example.com"
          />
        </label>

        <label>
          Contact phone
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
        Location
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
        Social links (one per line)
        <textarea
          value={socialLinksText}
          onChange={(event) => onSocialLinksChange(event.target.value)}
          rows={3}
          placeholder={"https://linkedin.com/in/example\nhttps://instagram.com/example"}
        />
      </label>

      <label>
        Content constraints (one per line)
        <textarea
          value={constraintsText}
          onChange={(event) => onConstraintsChange(event.target.value)}
          rows={3}
          placeholder={"Avoid jargon\nKeep claims evidence-based"}
        />
      </label>
    </section>
  );
}

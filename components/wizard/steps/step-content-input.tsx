import type { TestimonialInput } from "@/lib/ai/prompts/types";
import type { WebsiteWizardInput, WebsiteWizardInputPatch } from "@/lib/wizard";

interface StepContentInputProps {
  data: WebsiteWizardInput;
  testimonialsText: string;
  socialLinksText: string;
  constraintsText: string;
  errors?: string[];
  onFieldChange: (patch: WebsiteWizardInputPatch) => void;
  onTestimonialsChange: (value: string) => void;
  onSocialLinksChange: (value: string) => void;
  onConstraintsChange: (value: string) => void;
}

function testimonialHint(testimonials: TestimonialInput[]): string {
  if (!testimonials.length) {
    return "Optional. Format: quote | author | role (escape pipe with \\|)";
  }

  return `${testimonials.length} testimonial ${testimonials.length === 1 ? "entry" : "entries"} parsed`;
}

export function StepContentInput({
  data,
  testimonialsText,
  socialLinksText,
  constraintsText,
  errors = [],
  onFieldChange,
  onTestimonialsChange,
  onSocialLinksChange,
  onConstraintsChange,
}: StepContentInputProps) {
  const testimonialError = errors.includes("Each testimonial needs both quote and author.");
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

      <label>
        <span>Testimonials</span>
        <textarea
          value={testimonialsText}
          onChange={(event) => onTestimonialsChange(event.target.value)}
          rows={4}
          placeholder={"They delivered incredible ROI | Alex Chen | Founder\nA seamless process | Dana Park | Marketing Lead"}
          aria-invalid={testimonialError || undefined}
          aria-describedby={
            testimonialError
              ? "wizard-testimonials-hint wizard-testimonials-error"
              : "wizard-testimonials-hint"
          }
        />
        <span className="wizard-field-hint" id="wizard-testimonials-hint">
          {testimonialHint(data.testimonials)}
        </span>
        {testimonialError ? (
          <span className="wizard-field-error" id="wizard-testimonials-error">
            Each testimonial needs both quote and author.
          </span>
        ) : null}
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

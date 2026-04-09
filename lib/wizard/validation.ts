import type { WebsiteWizardInput, WizardStepId } from "./types";

function hasContent(value?: string): boolean {
  return Boolean(value?.trim());
}

function hasAnyValue(values?: string[]): boolean {
  return Boolean(values?.some((value) => hasContent(value)));
}

export function validateWebsiteTypeStep(data: WebsiteWizardInput): string[] {
  const errors: string[] = [];

  if (!data.websiteType) {
    errors.push("Select a website type to continue.");
  }

  return errors;
}

export function validateBusinessInfoStep(data: WebsiteWizardInput): string[] {
  const errors: string[] = [];

  if (!hasContent(data.brandName)) {
    errors.push("Brand name is required.");
  }

  if (!hasContent(data.description)) {
    errors.push("Short description is required.");
  }

  if (!hasContent(data.targetAudience)) {
    errors.push("Target audience is required.");
  }

  if (!hasAnyValue(data.services)) {
    errors.push("Add at least one service or offer.");
  }

  if (!hasContent(data.primaryCta)) {
    errors.push("Primary CTA is required.");
  }

  return errors;
}

export function validateStyleThemeStep(data: WebsiteWizardInput): string[] {
  const errors: string[] = [];

  if (!data.style) {
    errors.push("Select a style preference.");
  }

  if (!data.tone) {
    errors.push("Select a tone preference.");
  }

  if (data.style === "custom" && !hasContent(data.customStyleNotes)) {
    errors.push("Add custom style notes when style is set to custom.");
  }

  if (data.tone === "custom" && !hasContent(data.customToneNotes)) {
    errors.push("Add custom tone notes when tone is set to custom.");
  }

  return errors;
}

export function validateContentInputStep(data: WebsiteWizardInput): string[] {
  const errors: string[] = [];

  const invalidTestimonials = data.testimonials.filter(
    (testimonial) => hasContent(testimonial.quote) !== hasContent(testimonial.author),
  );

  if (invalidTestimonials.length > 0) {
    errors.push("Each testimonial needs both quote and author.");
  }

  const email = data.contactInfo.email?.trim();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Contact email must be a valid email address.");
  }

  return errors;
}

export function validateReviewStep(data: WebsiteWizardInput): string[] {
  return [
    ...validateWebsiteTypeStep(data),
    ...validateBusinessInfoStep(data),
    ...validateStyleThemeStep(data),
    ...validateContentInputStep(data),
  ];
}

export function validateWizardStep(stepId: WizardStepId, data: WebsiteWizardInput): string[] {
  switch (stepId) {
    case "website-type":
      return validateWebsiteTypeStep(data);
    case "business-info":
      return validateBusinessInfoStep(data);
    case "style-theme":
      return validateStyleThemeStep(data);
    case "content-input":
      return validateContentInputStep(data);
    case "review-confirm":
      return validateReviewStep(data);
    default:
      return [];
  }
}

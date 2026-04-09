import { validateReviewStep } from "@/lib/wizard";
import type { WebsiteWizardInput } from "@/lib/wizard";

export function validateGenerationInput(input: WebsiteWizardInput): string[] {
  return validateReviewStep(input);
}

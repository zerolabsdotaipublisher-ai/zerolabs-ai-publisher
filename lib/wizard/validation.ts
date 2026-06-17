import type { WebsiteWizardInput, WizardStepId } from "./types";

function hasContent(value?: string): boolean {
  return Boolean(value?.trim());
}

function validatePageDesign(page: WebsiteWizardInput["designConfig"]["pages"][number], index: number): string[] {
  const errors: string[] = [];
  const pageLabel = page.name?.trim() || `Page ${index + 1}`;

  if (!hasContent(page.layout)) {
    errors.push(`${pageLabel}: choose a layout.`);
  }

  if (!hasContent(page.background.primaryColor)) {
    errors.push(`${pageLabel}: choose a primary background color.`);
  }

  if (
    (page.background.type === "blend" || page.background.type === "gradient") &&
    !hasContent(page.background.secondaryColor)
  ) {
    errors.push(`${pageLabel}: choose a secondary background color.`);
  }

  if (page.background.type === "gradient" && !hasContent(page.background.gradientDirection)) {
    errors.push(`${pageLabel}: choose a gradient direction.`);
  }

  if (page.background.type === "image" && !hasContent(page.background.imageUrl)) {
    errors.push(`${pageLabel}: add an image URL for the selected background style.`);
  }

  if (page.background.type === "video" && !hasContent(page.background.videoUrl)) {
    errors.push(`${pageLabel}: add a video URL for the selected background style.`);
  }

  if (!hasContent(page.typography.bodyFont)) {
    errors.push(`${pageLabel}: choose a body font family.`);
  }

  if (!hasContent(page.typography.bodyColor)) {
    errors.push(`${pageLabel}: choose a body font color.`);
  }

  if (!hasContent(page.typography.fontMood)) {
    errors.push(`${pageLabel}: choose a font mood.`);
  }

  if (!hasContent(page.headings.headingFont)) {
    errors.push(`${pageLabel}: choose a heading font family.`);
  }

  if (!hasContent(page.headings.headingColor)) {
    errors.push(`${pageLabel}: choose a heading color.`);
  }

  if (!hasContent(page.headings.headingWeight)) {
    errors.push(`${pageLabel}: choose a heading weight.`);
  }

  if (!hasContent(page.headings.headingScale)) {
    errors.push(`${pageLabel}: choose a heading scale.`);
  }

  if (!hasContent(page.contentPrompt)) {
    errors.push(`${pageLabel}: describe what this page should include.`);
  }

  return errors;
}

export function validatePageSetupStep(data: WebsiteWizardInput): string[] {
  const errors: string[] = [];
  const { pages } = data.designConfig;

  if (!pages.length) {
    errors.push("Add at least one page to continue.");
  }

  if (pages.some((page) => !hasContent(page.layout))) {
    errors.push("Each page needs a default layout selection.");
  }

  if (pages.some((page) => !hasContent(page.name))) {
    errors.push("Each page needs a name.");
  }

  return errors;
}

export function validateBusinessInfoStep(data?: WebsiteWizardInput): string[] {
  void data;
  return [];
}

export function validatePageDesignStep(data: WebsiteWizardInput): string[] {
  return data.designConfig.pages.flatMap((page, index) => validatePageDesign(page, index));
}

export function validateBrandContentStep(data: WebsiteWizardInput): string[] {
  void data;
  return [];
}

export function validateOptionalContentInputs(data: WebsiteWizardInput): string[] {
  const errors: string[] = [];

  const email = data.contactInfo.email?.trim();
  if (email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
    errors.push("Contact email must be a valid email address.");
  }

  return errors;
}

export function validateReviewStep(data: WebsiteWizardInput): string[] {
  return [
    ...validatePageSetupStep(data),
    ...validatePageDesignStep(data),
    ...validateBusinessInfoStep(data),
    ...validateBrandContentStep(data),
    ...validateOptionalContentInputs(data),
  ];
}

export function validateWizardStep(stepId: WizardStepId, data: WebsiteWizardInput): string[] {
  switch (stepId) {
    case "page-setup":
      return validatePageSetupStep(data);
    case "page-design":
      return validatePageDesignStep(data);
    case "brand-content":
      return [];
    case "review-confirm":
      return validateReviewStep(data);
    default:
      return [];
  }
}

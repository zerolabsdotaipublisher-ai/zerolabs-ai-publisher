import type {
  ContactInfoInput,
  FounderProfileInput,
  StylePreset,
  TestimonialInput,
  TonePreset,
  WebsiteGenerationInput,
  WebsiteType,
} from "@/lib/ai/prompts/types";

export type WizardStepId =
  | "website-type"
  | "business-info"
  | "style-theme"
  | "content-input"
  | "review-confirm"
  | "loading"
  | "success";

export type GenerationStatus = "idle" | "submitting" | "success" | "error";

export interface WizardStepDefinition {
  id: WizardStepId;
  title: string;
  purpose: string;
  required: boolean;
  skippable: boolean;
}

export interface WebsiteWizardInput {
  websiteType: WebsiteType;
  brandName: string;
  description: string;
  targetAudience: string;
  services: string[];
  primaryCta: string;
  tone: TonePreset;
  style: StylePreset;
  customToneNotes: string;
  customStyleNotes: string;
  founderProfile: FounderProfileInput;
  testimonials: TestimonialInput[];
  contactInfo: ContactInfoInput;
  constraints: string[];
}

export interface WizardGenerationResult {
  structureId?: string;
  generatedSitePath?: string;
  completedAt?: string;
  error?: string;
}

export interface WebsiteCreationWizardState {
  currentStep: WizardStepId;
  completedSteps: WizardStepId[];
  data: WebsiteWizardInput;
  stepErrors: Partial<Record<WizardStepId, string[]>>;
  generationStatus: GenerationStatus;
  generationResult?: WizardGenerationResult;
}

export interface WizardScenario {
  id: string;
  name: string;
  goal: string;
  notes: string;
}

export type WizardGenerationPayload = WebsiteGenerationInput;

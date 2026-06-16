import type {
  ContactInfoInput,
  WebsiteDesignConfig,
  FounderProfileInput,
  StylePreset,
  TonePreset,
  WebsiteGenerationInput,
  WebsiteType,
} from "@/lib/ai/prompts/types";

export type WizardStepId =
  | "page-setup"
  | "page-design"
  | "brand-content"
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
  domainName: string;
  description: string;
  targetAudience: string;
  services: string[];
  primaryCta: string;
  tone: TonePreset;
  style: StylePreset;
  customToneNotes: string;
  customStyleNotes: string;
  founderProfile: FounderProfileInput;
  contactInfo: ContactInfoInput;
  constraints: string[];
  designConfig: WebsiteDesignConfig;
}

export interface WebsiteDesignConfigPatch {
  pages?: WebsiteDesignConfig["pages"];
}

export type WebsiteWizardInputPatch = Partial<Omit<WebsiteWizardInput, "designConfig">> & {
  designConfig?: WebsiteDesignConfigPatch;
};

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

import type { StylePreset, TonePreset, WebsiteType } from "@/lib/ai/prompts/types";
import type { WebsiteWizardInput } from "./types";

export const websiteTypeOptions: Array<{ value: WebsiteType; label: string; description: string }> = [
  {
    value: "small-business",
    label: "Business website",
    description: "Service businesses, agencies, and local companies.",
  },
  {
    value: "portfolio",
    label: "Portfolio",
    description: "Showcase work, projects, and client outcomes.",
  },
  {
    value: "personal-brand",
    label: "Personal brand",
    description: "Position expertise and thought leadership.",
  },
  {
    value: "landing-page",
    label: "Landing page",
    description: "Single conversion-focused page for campaigns or offers.",
  },
];

export const toneOptions: Array<{ value: TonePreset; label: string }> = [
  { value: "professional", label: "Professional" },
  { value: "friendly", label: "Friendly" },
  { value: "bold", label: "Bold" },
  { value: "premium", label: "Premium" },
  { value: "casual", label: "Casual" },
  { value: "custom", label: "Custom" },
];

export const styleOptions: Array<{ value: StylePreset; label: string }> = [
  { value: "modern", label: "Modern" },
  { value: "minimalist", label: "Minimalist" },
  { value: "corporate", label: "Corporate" },
  { value: "editorial", label: "Editorial" },
  { value: "playful", label: "Playful" },
  { value: "custom", label: "Custom" },
];

export const defaultWizardInput: WebsiteWizardInput = {
  websiteType: "small-business",
  brandName: "",
  description: "",
  targetAudience: "",
  services: [],
  primaryCta: "",
  tone: "professional",
  style: "modern",
  customToneNotes: "",
  customStyleNotes: "",
  founderProfile: {
    name: "",
    role: "",
    bio: "",
  },
  testimonials: [],
  contactInfo: {
    email: "",
    phone: "",
    location: "",
    socialLinks: [],
  },
  constraints: [],
};

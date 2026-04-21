export type WebsiteType =
  | "portfolio"
  | "small-business"
  | "landing-page"
  | "personal-brand"
  | "blog";

export type TonePreset =
  | "professional"
  | "casual"
  | "premium"
  | "friendly"
  | "bold"
  | "custom";

export type StylePreset =
  | "minimalist"
  | "modern"
  | "corporate"
  | "editorial"
  | "playful"
  | "custom";

export type WebsiteSectionName =
  | "hero"
  | "about"
  | "services"
  | "testimonials"
  | "cta"
  | "contact"
  | "footer";

export interface FounderProfileInput {
  name?: string;
  role?: string;
  bio?: string;
}

export interface TestimonialInput {
  quote: string;
  author: string;
  role?: string;
}

export interface ContactInfoInput {
  email?: string;
  phone?: string;
  location?: string;
  socialLinks?: string[];
}

export interface WebsiteGenerationInput {
  websiteType: WebsiteType;
  brandName: string;
  description: string;
  targetAudience: string;
  tone: TonePreset;
  style: StylePreset;
  primaryCta: string;
  services: string[];
  founderProfile?: FounderProfileInput;
  testimonials?: TestimonialInput[];
  contactInfo?: ContactInfoInput;
  constraints?: string[];
  customToneNotes?: string;
  customStyleNotes?: string;
}

export interface SectionBase {
  headline: string;
  subheadline?: string;
}

export interface HeroSection extends SectionBase {
  primaryCta: string;
  secondaryCta?: string;
}

export interface AboutSection extends SectionBase {
  body: string;
}

export interface ServicesSection extends SectionBase {
  items: Array<{ name: string; description: string }>;
}

export interface TestimonialsSection extends SectionBase {
  items: Array<{ quote: string; author: string; role?: string }>;
}

export interface CtaSection extends SectionBase {
  ctaText: string;
}

export interface ContactSection extends SectionBase {
  channels: Array<{ label: string; value: string }>;
}

export interface FooterSection {
  shortBlurb: string;
  legalText?: string;
}

export interface WebsiteGenerationOutput {
  websiteType: WebsiteType;
  siteTitle: string;
  tagline: string;
  sections: {
    hero: HeroSection;
    about?: AboutSection;
    services?: ServicesSection;
    testimonials?: TestimonialsSection;
    cta?: CtaSection;
    contact?: ContactSection;
    footer?: FooterSection;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  styleHints: {
    tone: TonePreset;
    style: StylePreset;
    colorMood: string;
    typographyMood: string;
  };
}

export interface PromptBuildOptions {
  includeSections?: WebsiteSectionName[];
  compact?: boolean;
}

export interface PromptBundle {
  input: WebsiteGenerationInput;
  corePrompt: string;
  sectionPrompts: Partial<Record<WebsiteSectionName, string>>;
}

import type {
  BackgroundStyleType,
  FontMood,
  FontSizePreference,
  HeadingScale,
  PageDesignConfig,
  StylePreset,
  TonePreset,
  WebsiteBackgroundDesign,
  WebsiteDesignConfig,
  WebsiteHeadingDesign,
  WebsiteLayoutStructure,
  WebsiteTypographyDesign,
  WebsiteType,
} from "@/lib/ai/prompts/types";
import type { WebsiteWizardInput } from "./types";

function isObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function createPageId(index: number, name: string): string {
  return `page_${index + 1}_${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "page"}`;
}

export const backgroundStyleOptions: Array<{
  value: BackgroundStyleType;
  label: string;
  description: string;
}> = [
  { value: "solid", label: "Solid color", description: "A single tone for a clean, focused canvas." },
  { value: "blend", label: "Blended color", description: "Two nearby tones softened into a premium wash." },
  { value: "gradient", label: "Gradient", description: "Directional color movement for stronger depth." },
  { value: "image", label: "Image background", description: "Use a hosted image as the visual backdrop." },
  { value: "video", label: "Video background", description: "Use a hosted looping video for motion." },
];

export const gradientDirectionOptions = [
  { value: "to right", label: "Left to right" },
  { value: "to bottom", label: "Top to bottom" },
  { value: "135deg", label: "Diagonal" },
  { value: "circle at center", label: "Radial center" },
] as const;

export const fontFamilyOptions = [
  {
    value: 'Inter, "Segoe UI", Arial, sans-serif',
    label: "Inter / UI Sans",
    description: "Neutral and modern sans-serif.",
  },
  {
    value: '"Space Grotesk", "Segoe UI", Arial, sans-serif',
    label: "Space Grotesk",
    description: "Sharper display-friendly sans.",
  },
  {
    value: '"Avenir Next", "Segoe UI", Arial, sans-serif',
    label: "Avenir Next",
    description: "Polished and premium sans.",
  },
  {
    value: 'Georgia, "Times New Roman", serif',
    label: "Georgia",
    description: "Readable classic serif.",
  },
  {
    value: '"Playfair Display", Georgia, serif',
    label: "Playfair Display",
    description: "High-contrast editorial serif.",
  },
  {
    value: '"Libre Baskerville", Georgia, serif',
    label: "Libre Baskerville",
    description: "Elegant long-form serif.",
  },
] as const;

export const fontMoodOptions: Array<{ value: FontMood; label: string; description: string }> = [
  { value: "modern", label: "Modern", description: "Clean, contemporary, and product-oriented." },
  { value: "editorial", label: "Editorial", description: "Story-led, refined, and magazine-like." },
  { value: "minimal", label: "Minimal", description: "Quiet, restrained, and spacious." },
  { value: "luxury", label: "Luxury", description: "Elevated, premium, and detail-driven." },
  { value: "bold", label: "Bold", description: "Confident, high-contrast, and assertive." },
  { value: "friendly", label: "Friendly", description: "Warm, approachable, and accessible." },
];

export const fontSizePreferenceOptions: Array<{
  value: FontSizePreference;
  label: string;
  description: string;
}> = [
  { value: "compact", label: "Compact", description: "Tighter rhythm with smaller body copy." },
  { value: "comfortable", label: "Comfortable", description: "Balanced sizing for most sites." },
  { value: "large", label: "Large", description: "Airier copy with stronger readability." },
];

export const headingWeightOptions = [
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra bold" },
] as const;

export const headingScaleOptions: Array<{
  value: HeadingScale;
  label: string;
  description: string;
}> = [
  { value: "large", label: "Large hero headings", description: "Oversized type for bold hero sections." },
  { value: "balanced", label: "Balanced headings", description: "Flexible hierarchy for general sites." },
  { value: "compact", label: "Compact headings", description: "Denser layouts with tighter headline scale." },
  { value: "editorial", label: "Editorial headings", description: "High-contrast hierarchy for story-led layouts." },
];

export const layoutStructureOptions: Array<{
  value: Exclude<WebsiteLayoutStructure, "dashboard-style">;
  label: string;
  description: string;
}> = [
  { value: "hero-sections", label: "Hero + sections", description: "Classic hero-led site with stacked content sections." },
  { value: "landing-page", label: "Landing page", description: "Single conversion-focused experience with persuasive flow." },
  { value: "portfolio-layout", label: "Portfolio layout", description: "Project-forward layout with work highlights and case studies." },
  { value: "blog-content", label: "Blog/content layout", description: "Content-led layout for articles, insights, and resources." },
  { value: "service-business", label: "Service business layout", description: "Trust-building sections for expertise, proof, and inquiries." },
  { value: "product-showcase", label: "Product showcase", description: "Feature-rich layout centered on product value and visuals." },
  { value: "split-screen", label: "Split-screen layout", description: "Two-column visual rhythm with strong contrast." },
  { value: "grid-gallery", label: "Grid gallery layout", description: "Visual grid presentation for collections and showcases." },
  { value: "contact-info", label: "Contact/info layout", description: "Simple contact-first layout for forms, details, and location." },
  { value: "about-story", label: "About/story layout", description: "Narrative-led layout for mission, history, and team." },
];

export const suggestedPageNames = [
  "Home",
  "About",
  "Services",
  "Portfolio",
  "Blog",
  "Contact",
] as const;

const layoutToWebsiteType: Record<WebsiteLayoutStructure, WebsiteType> = {
  "hero-sections": "small-business",
  "landing-page": "landing-page",
  "portfolio-layout": "portfolio",
  "blog-content": "blog",
  "service-business": "small-business",
  "product-showcase": "landing-page",
  "split-screen": "personal-brand",
  "grid-gallery": "portfolio",
  "contact-info": "small-business",
  "about-story": "personal-brand",
  "dashboard-style": "small-business",
};

export function inferWebsiteTypeFromLayout(layout: WebsiteLayoutStructure): WebsiteType {
  return layoutToWebsiteType[layout] ?? "small-business";
}

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

const defaultBackground: WebsiteBackgroundDesign = {
  type: "gradient",
  primaryColor: "#0f352b",
  secondaryColor: "#145340",
  gradientDirection: "135deg",
};

const defaultTypography: WebsiteTypographyDesign = {
  bodyFont: fontFamilyOptions[0].value,
  bodyColor: "#f8f9fa",
  fontMood: "modern",
  fontSizePreference: "comfortable",
};

const defaultHeadings: WebsiteHeadingDesign = {
  headingFont: fontFamilyOptions[1].value,
  headingColor: "#f8f9fa",
  headingWeight: "700",
  headingScale: "large",
};

export function getSuggestedPagePrompt(name: string, layout?: WebsiteLayoutStructure): string {
  const normalizedName = name.trim().toLowerCase();

  if (normalizedName === "home") {
    return "Hero, value proposition, proof, and primary CTA.";
  }
  if (normalizedName === "about") {
    return "Story, mission, team, and credibility signals.";
  }
  if (normalizedName === "services") {
    return "Service cards, outcomes, pricing cues, and CTA.";
  }
  if (normalizedName === "portfolio") {
    return "Featured work, case studies, and results.";
  }
  if (normalizedName === "blog") {
    return "Featured articles, categories, and newsletter CTA.";
  }
  if (normalizedName === "contact") {
    return "Contact form, email, phone, location, and response expectation.";
  }

  switch (layout) {
    case "landing-page":
      return "Conversion-focused sections, differentiators, proof, and CTA.";
    case "portfolio-layout":
    case "grid-gallery":
      return "Visual showcase, featured projects, and supporting context.";
    case "blog-content":
      return "Content highlights, article groups, and navigation to posts.";
    case "contact-info":
      return "Contact methods, form, location, and trust-building details.";
    case "about-story":
      return "Origin story, values, team, and credibility.";
    default:
      return "Key page sections, supporting details, and a clear CTA.";
  }
}

export function createDefaultPageConfig(
  index: number,
  overrides?: Partial<PageDesignConfig>,
): PageDesignConfig {
  const name = overrides?.name?.trim() || suggestedPageNames[index] || `Page ${index + 1}`;
  const layout = overrides?.layout || "hero-sections";

  return {
    id: overrides?.id || createPageId(index, name),
    name,
    layout,
    background: {
      ...defaultBackground,
      ...overrides?.background,
    },
    typography: {
      ...defaultTypography,
      ...overrides?.typography,
    },
    headings: {
      ...defaultHeadings,
      ...overrides?.headings,
    },
    contentPrompt: overrides?.contentPrompt?.trim() || getSuggestedPagePrompt(name, layout),
  };
}

function normalizeLayout(value: unknown, fallback: WebsiteLayoutStructure): WebsiteLayoutStructure {
  if (typeof value !== "string") {
    return fallback;
  }

  const found = [...layoutStructureOptions.map((option) => option.value), "dashboard-style"].find(
    (option) => option === value,
  );
  return (found as WebsiteLayoutStructure | undefined) ?? fallback;
}

function normalizeBackground(
  value: unknown,
  fallback = defaultBackground,
): WebsiteBackgroundDesign {
  if (!isObject(value)) {
    return { ...fallback };
  }

  return {
    type: (typeof value.type === "string" ? value.type : fallback.type) as BackgroundStyleType,
    primaryColor:
      typeof value.primaryColor === "string" && value.primaryColor.trim()
        ? value.primaryColor
        : fallback.primaryColor,
    secondaryColor:
      typeof value.secondaryColor === "string" && value.secondaryColor.trim()
        ? value.secondaryColor
        : fallback.secondaryColor,
    gradientDirection:
      typeof value.gradientDirection === "string" && value.gradientDirection.trim()
        ? value.gradientDirection
        : fallback.gradientDirection,
    imageUrl:
      typeof value.imageUrl === "string" && value.imageUrl.trim() ? value.imageUrl : undefined,
    videoUrl:
      typeof value.videoUrl === "string" && value.videoUrl.trim() ? value.videoUrl : undefined,
  };
}

function normalizeTypography(
  value: unknown,
  fallback = defaultTypography,
): WebsiteTypographyDesign {
  if (!isObject(value)) {
    return { ...fallback };
  }

  return {
    bodyFont:
      typeof value.bodyFont === "string" && value.bodyFont.trim()
        ? value.bodyFont
        : fallback.bodyFont,
    bodyColor:
      typeof value.bodyColor === "string" && value.bodyColor.trim()
        ? value.bodyColor
        : fallback.bodyColor,
    fontMood:
      (typeof value.fontMood === "string" ? value.fontMood : fallback.fontMood) as FontMood,
    fontSizePreference:
      (typeof value.fontSizePreference === "string"
        ? value.fontSizePreference
        : fallback.fontSizePreference) as FontSizePreference,
  };
}

function normalizeHeadings(
  value: unknown,
  fallback = defaultHeadings,
): WebsiteHeadingDesign {
  if (!isObject(value)) {
    return { ...fallback };
  }

  return {
    headingFont:
      typeof value.headingFont === "string" && value.headingFont.trim()
        ? value.headingFont
        : fallback.headingFont,
    headingColor:
      typeof value.headingColor === "string" && value.headingColor.trim()
        ? value.headingColor
        : fallback.headingColor,
    headingWeight:
      typeof value.headingWeight === "string" && value.headingWeight.trim()
        ? value.headingWeight
        : fallback.headingWeight,
    headingScale:
      (typeof value.headingScale === "string"
        ? value.headingScale
        : fallback.headingScale) as HeadingScale,
  };
}

export function normalizeDesignConfig(value: unknown): WebsiteDesignConfig {
  const legacyRoot = isObject(value) ? value : {};
  const legacyLayout = isObject(legacyRoot.layout)
    ? normalizeLayout(legacyRoot.layout.structure, "hero-sections")
    : "hero-sections";
  const fallbackBackground = normalizeBackground(legacyRoot.background, defaultBackground);
  const fallbackTypography = normalizeTypography(legacyRoot.typography, defaultTypography);
  const fallbackHeadings = normalizeHeadings(legacyRoot.headings, defaultHeadings);
  const pagesInput = Array.isArray(legacyRoot.pages) ? legacyRoot.pages : [];

  if (pagesInput.length === 0) {
    return {
      pages: suggestedPageNames.map((name, index) =>
        createDefaultPageConfig(index, {
          name,
          layout: legacyLayout,
          background: fallbackBackground,
          typography: fallbackTypography,
          headings: fallbackHeadings,
        }),
      ),
    };
  }

  return {
    pages: pagesInput.map((pageValue, index) => {
      const page = isObject(pageValue) ? pageValue : {};
      const layout = normalizeLayout(page.layout, legacyLayout);

      return createDefaultPageConfig(index, {
        id: typeof page.id === "string" && page.id.trim() ? page.id : undefined,
        name: typeof page.name === "string" && page.name.trim() ? page.name : undefined,
        layout,
        background: normalizeBackground(page.background, fallbackBackground),
        typography: normalizeTypography(page.typography, fallbackTypography),
        headings: normalizeHeadings(page.headings, fallbackHeadings),
        contentPrompt:
          typeof page.contentPrompt === "string" && page.contentPrompt.trim()
            ? page.contentPrompt
            : undefined,
      });
    }),
  };
}

export function clonePageDesignConfig(page: PageDesignConfig): PageDesignConfig {
  return {
    ...page,
    background: { ...page.background },
    typography: { ...page.typography },
    headings: { ...page.headings },
  };
}

export function syncDesignPages(pages: PageDesignConfig[], count: number): PageDesignConfig[] {
  const safeCount = Math.max(1, Math.min(count, 12));
  const nextPages = pages.slice(0, safeCount).map(clonePageDesignConfig);

  while (nextPages.length < safeCount) {
    nextPages.push(createDefaultPageConfig(nextPages.length));
  }

  return nextPages.map((page, index) =>
    createDefaultPageConfig(index, {
      ...page,
      id: page.id || createPageId(index, page.name),
    }),
  );
}

export function inferWebsiteTypeFromPages(pages: PageDesignConfig[]): WebsiteType {
  const primaryPage =
    pages.find((page) => page.name.trim().toLowerCase() === "home") ??
    pages[0];

  return primaryPage ? inferWebsiteTypeFromLayout(primaryPage.layout) : "small-business";
}

export const defaultDesignConfig: WebsiteDesignConfig = {
  pages: syncDesignPages([], suggestedPageNames.length),
};

export const defaultWizardInput: WebsiteWizardInput = {
  websiteType: inferWebsiteTypeFromPages(defaultDesignConfig.pages),
  brandName: "",
  domainName: "",
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
  contactInfo: {
    email: "",
    phone: "",
    location: "",
    socialLinks: [],
  },
  constraints: [],
  designConfig: defaultDesignConfig,
};

export function createDefaultWizardInput(): WebsiteWizardInput {
  return {
    ...defaultWizardInput,
    founderProfile: { ...defaultWizardInput.founderProfile },
    contactInfo: {
      ...defaultWizardInput.contactInfo,
      socialLinks: [...(defaultWizardInput.contactInfo.socialLinks ?? [])],
    },
    services: [...defaultWizardInput.services],
    constraints: [...defaultWizardInput.constraints],
    designConfig: {
      pages: defaultWizardInput.designConfig.pages.map(clonePageDesignConfig),
    },
  };
}

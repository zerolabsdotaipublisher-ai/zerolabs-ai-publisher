import type {
  ContactInfoInput,
  FounderProfileInput,
  TestimonialInput,
  WebsiteGenerationInput,
  WebsiteType,
} from "./prompts/types";

interface SampleTestimonialProfile {
  quote: string;
  author: string;
  role: string;
  company?: string;
}

export interface SampleWebsiteProfile {
  brandName: string;
  description: string;
  targetAudience: string;
  primaryCta: string;
  services: string[];
  location: string;
  sampleTestimonials: SampleTestimonialProfile[];
}

export interface ResolvedWebsiteGenerationInput {
  input: WebsiteGenerationInput;
  profile: SampleWebsiteProfile;
  usedFallbackDefaults: boolean;
  usedSampleProfile: boolean;
}

const SAMPLE_WEBSITE_PROFILES: Record<WebsiteType, SampleWebsiteProfile> = {
  "small-business": {
    brandName: "Harborview Home Services",
    description:
      "A dependable local team for repairs, maintenance, and installations with clear scheduling and practical advice.",
    targetAudience:
      "homeowners and property managers who want reliable service without the runaround",
    primaryCta: "Book a consultation",
    services: ["On-site assessments", "Repair and maintenance", "Installation planning"],
    location: "Available locally and by appointment",
    sampleTestimonials: [
      {
        quote:
          "The process stayed simple from the first call to the final walkthrough, and every next step was easy to understand.",
        author: "Jordan P.",
        role: "Homeowner",
      },
      {
        quote:
          "Fast communication, realistic timelines, and work that felt organized from day one.",
        author: "Melissa R.",
        role: "Property manager",
      },
    ],
  },
  portfolio: {
    brandName: "Marlow Studio",
    description:
      "A design practice creating launch-ready brands, websites, and editorial systems for growing teams.",
    targetAudience:
      "founders and marketing teams that want thoughtful execution and a clear point of view",
    primaryCta: "View the work",
    services: ["Brand systems", "Launch websites", "Editorial design"],
    location: "Available for remote and on-site projects",
    sampleTestimonials: [
      {
        quote:
          "The final work felt sharper, more confident, and much easier for our team to use across every launch touchpoint.",
        author: "Nina S.",
        role: "Marketing director",
      },
      {
        quote:
          "Thoughtful design decisions, clear rationale, and a process that stayed calm even when the scope moved quickly.",
        author: "Ethan K.",
        role: "Founder",
      },
    ],
  },
  "landing-page": {
    brandName: "Northstar Planner",
    description:
      "A lightweight planning platform that helps distributed teams turn weekly priorities into visible progress.",
    targetAudience:
      "operations and product teams that need simple planning without extra process",
    primaryCta: "Start your free trial",
    services: ["Weekly planning", "Team alignment", "Progress visibility"],
    location: "Remote-first support",
    sampleTestimonials: [
      {
        quote:
          "The message became clearer in the first review, and the final page made the offer much easier to understand.",
        author: "Avery L.",
        role: "Operations lead",
      },
      {
        quote:
          "Everything felt tighter, more focused, and more conversion-ready without sounding forced or overhyped.",
        author: "Chris M.",
        role: "Product manager",
      },
    ],
  },
  "personal-brand": {
    brandName: "Avery Lane",
    description:
      "An independent strategist helping founders clarify positioning, sharpen offers, and ship stronger marketing systems.",
    targetAudience:
      "founders and small teams that want senior-level guidance without agency overhead",
    primaryCta: "Book an intro call",
    services: ["Positioning strategy", "Offer messaging", "Launch planning"],
    location: "Remote consulting",
    sampleTestimonials: [
      {
        quote:
          "Straight answers, clear priorities, and advice we could actually put into practice right away.",
        author: "Renee T.",
        role: "Founder",
      },
      {
        quote:
          "The work gave us a sharper message and a much clearer sense of what to say next.",
        author: "Daniel C.",
        role: "Growth lead",
      },
    ],
  },
  blog: {
    brandName: "Field Notes Journal",
    description:
      "A practical publication covering operations, growth, and product work in clear, useful language.",
    targetAudience:
      "operators, founders, and marketers looking for practical lessons they can use this week",
    primaryCta: "Read the latest article",
    services: ["Practical guides", "Case notes", "Weekly insights"],
    location: "Published remotely",
    sampleTestimonials: [
      {
        quote:
          "Consistently clear, useful, and easy to revisit when the team needs a fast answer.",
        author: "Subscriber example",
        role: "Newsletter reader",
      },
    ],
  },
  article: {
    brandName: "Signal Review",
    description:
      "A long-form editorial series that breaks down strategy, execution, and product thinking into usable lessons.",
    targetAudience:
      "professionals who prefer clear analysis over trend-chasing",
    primaryCta: "Read the full article",
    services: ["Explainers", "Deep dives", "Frameworks"],
    location: "Published remotely",
    sampleTestimonials: [
      {
        quote:
          "The writing stayed direct, thoughtful, and practical instead of drifting into vague trend talk.",
        author: "Reader example",
        role: "Industry subscriber",
      },
    ],
  },
};

const WEAK_TEXT_PATTERNS = [
  /\btest(?:ing)?\b/i,
  /\bteset\b/i,
  /\btset\b/i,
  /\bdemo\b/i,
  /\bsample\b/i,
  /\bplaceholder\b/i,
  /\blorem\b/i,
  /\bipsum\b/i,
  /\btodo\b/i,
  /\btbd\b/i,
  /\btemp(?:orary)?\b/i,
  /\btmp\b/i,
  /\bmock\b/i,
  /\bcoming soon\b/i,
  /\bfoo\b/i,
  /\bbar\b/i,
  /\bbaz\b/i,
  /^n\/?a$/i,
  /^none$/i,
];

function normalizeWhitespace(value?: string): string {
  return value?.trim().replace(/\s+/g, " ") ?? "";
}

function toDomainSlug(value: string): string {
  const compact = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);

  return compact || "northstarstudio";
}

function lowerFirst(value: string): string {
  return value.charAt(0).toLowerCase() + value.slice(1);
}

function formatServicePhrase(services: string[]): string {
  const entries = services.map((service) => lowerFirst(service)).slice(0, 3);

  if (entries.length === 0) {
    return "clear, practical delivery";
  }

  if (entries.length === 1) {
    return entries[0];
  }

  if (entries.length === 2) {
    return `${entries[0]} and ${entries[1]}`;
  }

  return `${entries[0]}, ${entries[1]}, and ${entries[2]}`;
}

function sanitizeOptionalText(value?: string): string | undefined {
  const text = normalizeWhitespace(value);
  return text && !isWeakInputText(text) ? text : undefined;
}

function sanitizeTestimonials(
  testimonials?: TestimonialInput[],
): TestimonialInput[] | undefined {
  const clean = (testimonials ?? [])
    .map((testimonial) => ({
      quote: normalizeWhitespace(testimonial.quote),
      author: normalizeWhitespace(testimonial.author),
      role: sanitizeOptionalText(testimonial.role),
    }))
    .filter(
      (testimonial) =>
        testimonial.quote.length >= 24 &&
        !isWeakInputText(testimonial.quote) &&
        testimonial.author.length >= 2 &&
        !isWeakInputText(testimonial.author),
    );

  return clean.length > 0 ? clean : undefined;
}

function sanitizeFounderProfile(
  founderProfile?: FounderProfileInput,
): FounderProfileInput | undefined {
  if (!founderProfile) {
    return undefined;
  }

  const normalized = {
    name: sanitizeOptionalText(founderProfile.name),
    role: sanitizeOptionalText(founderProfile.role),
    bio: sanitizeOptionalText(founderProfile.bio),
  };

  return normalized.name || normalized.role || normalized.bio ? normalized : undefined;
}

function sanitizeContactInfo(
  contactInfo: ContactInfoInput | undefined,
  brandName: string,
  profile: SampleWebsiteProfile,
  useSampleContactDetails: boolean,
): ContactInfoInput | undefined {
  const email = sanitizeOptionalText(contactInfo?.email);
  const phone = sanitizeOptionalText(contactInfo?.phone);
  const location = sanitizeOptionalText(contactInfo?.location);
  const socialLinks = contactInfo?.socialLinks
    ?.map((link) => normalizeWhitespace(link))
    .filter(Boolean);

  if (!useSampleContactDetails && !email && !phone && !location && !socialLinks?.length) {
    return undefined;
  }

  return {
    email: email ?? (useSampleContactDetails ? `hello@${toDomainSlug(brandName)}.com` : undefined),
    phone,
    location: location ?? (useSampleContactDetails ? profile.location : undefined),
    socialLinks: socialLinks?.length ? socialLinks : undefined,
  };
}

function buildDerivedDescription(
  brandName: string,
  targetAudience: string,
  services: string[],
): string {
  const servicePhrase = formatServicePhrase(services);

  if (brandName && targetAudience && servicePhrase) {
    return `${brandName} helps ${targetAudience} with ${servicePhrase} delivered through clear communication, thoughtful execution, and practical next steps.`;
  }

  if (brandName && targetAudience) {
    return `${brandName} helps ${targetAudience} move faster with clear priorities and dependable delivery.`;
  }

  if (brandName && servicePhrase) {
    return `${brandName} delivers ${servicePhrase} with clear communication and practical execution.`;
  }

  return "Clear communication, practical execution, and steady momentum.";
}

export function getSampleWebsiteProfile(websiteType: WebsiteType): SampleWebsiteProfile {
  return SAMPLE_WEBSITE_PROFILES[websiteType] ?? SAMPLE_WEBSITE_PROFILES["small-business"];
}

export function isWeakInputText(value?: string): boolean {
  const text = normalizeWhitespace(value);
  if (!text) {
    return true;
  }

  if (WEAK_TEXT_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }

  const compact = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!compact) {
    return true;
  }

  if (
    /^(test|testing|teset|tset|demo|sample|placeholder|todo|tbd|lorem|ipsum|temp|tmp|foo|bar|baz|mock)+$/.test(
      compact,
    )
  ) {
    return true;
  }

  if (/^(.)\1{3,}$/.test(compact)) {
    return true;
  }

  const tokens = text.toLowerCase().split(/\s+/).filter(Boolean);
  return tokens.length >= 2 && new Set(tokens).size === 1;
}

export function resolveWebsiteGenerationInput(
  rawInput: WebsiteGenerationInput,
): ResolvedWebsiteGenerationInput {
  const profile = getSampleWebsiteProfile(rawInput.websiteType);
  const brandCandidate = normalizeWhitespace(rawInput.brandName);
  const descriptionCandidate = normalizeWhitespace(rawInput.description);
  const audienceCandidate = normalizeWhitespace(rawInput.targetAudience);
  const ctaCandidate = normalizeWhitespace(rawInput.primaryCta);
  const validServices = rawInput.services
    .map((service) => normalizeWhitespace(service))
    .filter((service) => service.length > 0 && !isWeakInputText(service));

  const weakBrand = isWeakInputText(brandCandidate);
  const weakDescription =
    isWeakInputText(descriptionCandidate) ||
    (descriptionCandidate.length > 0 &&
      descriptionCandidate.toLowerCase() === brandCandidate.toLowerCase());
  const weakAudience = isWeakInputText(audienceCandidate);
  const weakCta = isWeakInputText(ctaCandidate);
  const weakServices = validServices.length === 0;
  const coreWeakCount = [
    weakBrand,
    weakDescription,
    weakAudience,
    weakCta,
    weakServices,
  ].filter(Boolean).length;

  const usedSampleProfile = weakBrand || coreWeakCount >= 3;
  const brandName = weakBrand ? profile.brandName : brandCandidate;
  const targetAudience = weakAudience ? profile.targetAudience : audienceCandidate;
  const primaryCta = weakCta ? profile.primaryCta : ctaCandidate;
  const services = weakServices ? profile.services : validServices;
  const description = weakDescription
    ? usedSampleProfile
      ? profile.description
      : buildDerivedDescription(brandName, targetAudience, services)
    : descriptionCandidate;

  const input: WebsiteGenerationInput = {
    ...rawInput,
    brandName,
    description,
    targetAudience,
    primaryCta,
    services,
    founderProfile: sanitizeFounderProfile(rawInput.founderProfile),
    testimonials: sanitizeTestimonials(rawInput.testimonials),
    contactInfo: sanitizeContactInfo(
      rawInput.contactInfo,
      brandName,
      profile,
      weakBrand || coreWeakCount >= 4,
    ),
    constraints: rawInput.constraints
      ?.map((item) => normalizeWhitespace(item))
      .filter(Boolean),
    customToneNotes: normalizeWhitespace(rawInput.customToneNotes) || undefined,
    customStyleNotes: normalizeWhitespace(rawInput.customStyleNotes) || undefined,
  };

  return {
    input,
    profile,
    usedFallbackDefaults:
      weakBrand || weakDescription || weakAudience || weakCta || weakServices,
    usedSampleProfile,
  };
}

import { generateValidatedWebsiteNavigation } from "../navigation/generator";
import type { WebsiteNavigation } from "../navigation/types";
import type { SectionType, WebsitePage, WebsiteSection, WebsiteStructure } from "./types";

const MARKETING_WEBSITE_TYPES = new Set<WebsiteStructure["websiteType"]>([
  "portfolio",
  "small-business",
  "landing-page",
  "personal-brand",
]);

const ORDERED_MARKETING_SECTION_TYPES: SectionType[] = [
  "hero",
  "about",
  "services",
  "features",
  "benefits",
  "testimonials",
  "pricing",
  "faq",
  "cta",
  "contact",
  "footer",
];

interface RenderFallbackContext {
  siteTitle: string;
  tagline: string;
  description: string;
  targetAudience: string;
  primaryCta: string;
  services: string[];
  email?: string;
  phone?: string;
  location?: string;
  currentYear: number;
}

function generateNavigation(
  websiteType: WebsiteStructure["websiteType"],
  pages: WebsitePage[],
  siteTitle: string,
): WebsiteNavigation {
  const result = generateValidatedWebsiteNavigation({
    websiteType,
    siteTitle,
    pages: pages.map((page) => ({
      id: page.id,
      title: page.title,
      slug: page.slug,
      type: page.type,
      order: page.order,
      visible: page.visible ?? true,
      parentPageId: page.parentPageId,
      priority: page.priority,
      includeInNavigation:
        page.navigation?.includeInHeader ||
        page.navigation?.includeInFooter ||
        page.navigation?.includeInSidebar ||
        false,
      navigationLabel: page.navigationLabel,
    })),
  });

  return result.navigation;
}

function isMarketingWebsiteType(
  websiteType: WebsiteStructure["websiteType"],
): websiteType is Exclude<WebsiteStructure["websiteType"], "blog" | "article"> {
  return MARKETING_WEBSITE_TYPES.has(websiteType);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value
        .map((item) => readString(item))
        .filter((item): item is string => Boolean(item))
    : [];
}

function titleCaseSlug(value: string): string {
  return value
    .replace(/^\/+/, "")
    .split(/[-_/]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function createFallbackContext(structure: WebsiteStructure): RenderFallbackContext {
  const sourceInput = structure.sourceInput;
  const brandName = readString(sourceInput.brandName) ?? structure.siteTitle ?? "Your brand";
  const tagline =
    readString(structure.tagline) ??
    readString(sourceInput.description) ??
    `Clear messaging for ${readString(sourceInput.targetAudience) ?? "your audience"}.`;
  const description =
    readString(sourceInput.description) ??
    `${brandName} turns ideas into clear, practical next steps.`;
  const targetAudience = readString(sourceInput.targetAudience) ?? "your audience";
  const primaryCta = readString(sourceInput.primaryCta) ?? "Get started";
  const services = readStringArray(sourceInput.services);

  return {
    siteTitle: readString(structure.siteTitle) ?? brandName,
    tagline,
    description,
    targetAudience,
    primaryCta,
    services: services.length > 0 ? services : ["Strategy", "Execution", "Optimization"],
    email: readString(sourceInput.contactInfo?.email),
    phone: readString(sourceInput.contactInfo?.phone),
    location: readString(sourceInput.contactInfo?.location),
    currentYear: new Date().getFullYear(),
  };
}

function derivePageNavigationLabel(page: WebsitePage): string {
  if (page.type === "home" || page.slug === "/") {
    return "Home";
  }

  if (page.type === "about") {
    return "About";
  }

  if (page.type === "contact") {
    return "Contact";
  }

  const explicit = readString(page.navigationLabel);
  if (explicit && !explicit.startsWith("/")) {
    return explicit;
  }

  const title = readString(page.title);
  if (title && !title.startsWith("/")) {
    return title;
  }

  return titleCaseSlug(page.slug || page.type || "page") || "Page";
}

function marketingSectionsForPage(page: WebsitePage): SectionType[] {
  const existingTypes = new Set(page.sections.map((section) => section.type));
  const base =
    page.type === "about"
      ? ["hero", "about", "benefits", "testimonials", "cta", "footer"]
      : page.type === "services"
        ? ["hero", "services", "features", "pricing", "faq", "cta", "contact", "footer"]
        : page.type === "contact"
          ? ["hero", "contact", "faq", "cta", "footer"]
          : [
              "hero",
              "about",
              "services",
              "features",
              "testimonials",
              "pricing",
              "faq",
              "cta",
              "contact",
              "footer",
            ];

  base.forEach((type) => existingTypes.add(type as SectionType));

  return ORDERED_MARKETING_SECTION_TYPES.filter((type) => existingTypes.has(type));
}

function buildServiceItems(context: RenderFallbackContext) {
  return context.services.slice(0, 3).map((service) => ({
    name: service,
    description: `Delivered with clear milestones and practical implementation support for ${context.targetAudience}.`,
  }));
}

function buildInformationalItems(context: RenderFallbackContext, label: string) {
  const serviceNames = context.services.slice(0, 3);
  const seeds =
    serviceNames.length > 0
      ? serviceNames
      : [`${label} planning`, `${label} delivery`, `${label} optimization`];

  return seeds.map((seed) => ({
    title: seed,
    description: `${context.siteTitle} keeps ${seed.toLowerCase()} focused, practical, and easy to act on.`,
  }));
}

function normalizeHeroContent(
  content: Record<string, unknown>,
  context: RenderFallbackContext,
): Record<string, unknown> {
  const image = isRecord(content.image) ? content.image : {};

  return {
    variant: readString(content.variant) === "text-only" ? "text-only" : "with-image",
    eyebrow: readString(content.eyebrow) ?? `Built for ${context.targetAudience}`,
    headline: readString(content.headline) ?? context.siteTitle,
    subheadline:
      readString(content.subheadline) ??
      context.tagline ??
      `Built for ${context.targetAudience} with clear outcomes and practical execution.`,
    primaryCta:
      readString(content.primaryCta) ??
      readString(content.ctaText) ??
      context.primaryCta,
    secondaryCta: readString(content.secondaryCta) ?? "Learn more",
    supportingCopy: readString(content.supportingCopy) ?? context.description,
    ctaHref: readString(content.ctaHref) ?? "#contact",
    image: {
      src: readString(image.src),
      alt: readString(image.alt) ?? `${context.siteTitle} hero illustration`,
      promptHint:
        readString(image.promptHint) ??
        `${context.siteTitle} serving ${context.targetAudience}`,
    },
  };
}

function normalizeInformationalContent(
  content: Record<string, unknown>,
  context: RenderFallbackContext,
  fallbackHeadline: string,
): Record<string, unknown> {
  const paragraphs = readStringArray(content.paragraphs);
  const bullets = readStringArray(content.bullets);
  const items = Array.isArray(content.items)
    ? content.items
        .map((item) => {
          if (!isRecord(item)) {
            return null;
          }

          const title = readString(item.title) ?? readString(item.name);
          const description = readString(item.description);

          return title && description ? { title, description } : null;
        })
        .filter((item): item is { title: string; description: string } => Boolean(item))
    : [];
  const description =
    readString(content.description) ??
    readString(content.body) ??
    paragraphs[0] ??
    context.description;

  return {
    variant: readString(content.variant) ?? "stacked",
    headline: readString(content.headline) ?? fallbackHeadline,
    subheadline: readString(content.subheadline) ?? `Built for ${context.targetAudience}`,
    description,
    body: readString(content.body) ?? description,
    paragraphs:
      paragraphs.length > 0
        ? paragraphs
        : [
            context.description,
            `${context.siteTitle} combines strategy and execution so every section leads to a clear next step.`,
          ],
    bullets:
      bullets.length > 0
        ? bullets
        : ["Clear positioning", "Practical execution", "Sustained momentum"],
    items: items.length > 0 ? items : buildInformationalItems(context, fallbackHeadline),
  };
}

function normalizeServicesContent(
  content: Record<string, unknown>,
  context: RenderFallbackContext,
): Record<string, unknown> {
  const items = Array.isArray(content.items)
    ? content.items
        .map((item) => {
          if (!isRecord(item)) {
            return null;
          }

          const name = readString(item.name) ?? readString(item.title);
          const description = readString(item.description);

          return name && description ? { name, description } : null;
        })
        .filter((item): item is { name: string; description: string } => Boolean(item))
    : [];
  const paragraphs = readStringArray(content.paragraphs);
  const bullets = readStringArray(content.bullets);

  return {
    variant: readString(content.variant) ?? "service-grid",
    headline: readString(content.headline) ?? "Services",
    subheadline: readString(content.subheadline) ?? `Designed for ${context.targetAudience}`,
    description:
      readString(content.description) ??
      `${context.siteTitle} delivers focused work with measurable progress and clear communication.`,
    paragraphs:
      paragraphs.length > 0
        ? paragraphs
        : [
            `${context.siteTitle} keeps delivery focused on the outcomes that matter most.`,
          ],
    bullets: bullets.length > 0 ? bullets : context.services.slice(0, 3),
    items: items.length > 0 ? items : buildServiceItems(context),
  };
}

function normalizeTestimonialsContent(
  content: Record<string, unknown>,
  context: RenderFallbackContext,
): Record<string, unknown> {
  const items = Array.isArray(content.items)
    ? content.items
        .map((item) => {
          if (!isRecord(item)) {
            return null;
          }

          const quote = readString(item.quote);
          const author = readString(item.author);

          if (!quote || !author) {
            return null;
          }

          return {
            quote,
            author,
            role: readString(item.role),
            company: readString(item.company),
            isPlaceholder: Boolean(item.isPlaceholder),
          };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item))
    : [];

  return {
    variant: readString(content.variant) ?? (items.length > 1 ? "quote-grid" : "single-quote"),
    headline: readString(content.headline) ?? "Client feedback",
    subheadline: readString(content.subheadline) ?? "Representative outcomes from real work.",
    items:
      items.length > 0
        ? items
        : [
            {
              quote: "Clear process and strong communication from start to finish.",
              author: "Example Client",
              role: "Placeholder testimonial",
              company: context.siteTitle,
              isPlaceholder: true,
            },
          ],
  };
}

function normalizePricingContent(
  content: Record<string, unknown>,
  context: RenderFallbackContext,
): Record<string, unknown> {
  const tiers = Array.isArray(content.tiers)
    ? content.tiers
        .map((tier) => {
          if (!isRecord(tier)) {
            return null;
          }

          const name = readString(tier.name);
          const price = readString(tier.price);
          const description = readString(tier.description);
          const ctaText = readString(tier.ctaText);

          if (!name || !price || !description || !ctaText) {
            return null;
          }

          return {
            name,
            price,
            billingPeriod: readString(tier.billingPeriod),
            description,
            features: readStringArray(tier.features),
            ctaText,
            isFeatured: Boolean(tier.isFeatured),
          };
        })
        .filter((tier): tier is NonNullable<typeof tier> => Boolean(tier))
    : [];

  return {
    variant: readString(content.variant) ?? "two-tier",
    headline: readString(content.headline) ?? "Pricing built for clear next steps",
    subheadline:
      readString(content.subheadline) ??
      `Simple options for ${context.targetAudience} to choose the right fit.`,
    tiers:
      tiers.length > 0
        ? tiers
        : [
            {
              name: "Starter",
              price: "$499",
              billingPeriod: "/mo",
              description: "A fast way to launch the core offer with clear messaging.",
              features: [
                "Core offer positioning",
                "Essential landing-page sections",
                "Conversion-ready CTA copy",
              ],
              ctaText: context.primaryCta,
              isFeatured: false,
            },
            {
              name: "Growth",
              price: "$999",
              billingPeriod: "/mo",
              description: "More depth for teams that need stronger proof and expansion paths.",
              features: [
                "Everything in Starter",
                "Expanded proof and FAQ coverage",
                "Priority revision support",
              ],
              ctaText: "Choose Growth",
              isFeatured: true,
            },
          ],
    guaranteeLine: readString(content.guaranteeLine) ?? "Transparent scope. No inflated promises.",
    disclaimer:
      readString(content.disclaimer) ??
      "Illustrative pricing placeholders. Replace with live commercial terms before publishing.",
  };
}

function normalizeFaqContent(
  content: Record<string, unknown>,
  context: RenderFallbackContext,
): Record<string, unknown> {
  const items = Array.isArray(content.items)
    ? content.items
        .map((item) => {
          if (!isRecord(item)) {
            return null;
          }

          const question = readString(item.question);
          const answer = readString(item.answer);

          return question && answer ? { question, answer } : null;
        })
        .filter((item): item is { question: string; answer: string } => Boolean(item))
    : [];

  return {
    variant: readString(content.variant) ?? "expanded",
    headline: readString(content.headline) ?? "Frequently asked questions",
    subheadline:
      readString(content.subheadline) ??
      `Answers for ${context.targetAudience} before they commit.`,
    items:
      items.length > 0
        ? items
        : [
            {
              question: "How do we get started?",
              answer: "Start with a short discovery call and we will define scope, priorities, and outcomes.",
            },
            {
              question: "What does engagement look like?",
              answer: "Clear milestones, transparent communication, and practical deliverables from the first week.",
            },
          ],
  };
}

function normalizeCtaContent(
  content: Record<string, unknown>,
  context: RenderFallbackContext,
): Record<string, unknown> {
  return {
    variant: readString(content.variant) ?? "split",
    headline: readString(content.headline) ?? "Start with a clear next step",
    subheadline:
      readString(content.subheadline) ??
      `Tell ${context.siteTitle} what you need and get a practical plan back quickly.`,
    ctaText: readString(content.ctaText) ?? context.primaryCta,
    ctaHref: readString(content.ctaHref) ?? "#contact",
    secondaryCtaText: readString(content.secondaryCtaText) ?? "View details",
    secondaryCtaHref: readString(content.secondaryCtaHref) ?? "#services",
    urgencyLabel: readString(content.urgencyLabel) ?? "Practical scope. Clear outcomes.",
  };
}

function normalizeContactContent(
  content: Record<string, unknown>,
  context: RenderFallbackContext,
): Record<string, unknown> {
  const channels = Array.isArray(content.channels)
    ? content.channels
        .map((channel) => {
          if (!isRecord(channel)) {
            return null;
          }

          const label = readString(channel.label);
          const value = readString(channel.value);

          return label && value ? { label, value } : null;
        })
        .filter((channel): channel is { label: string; value: string } => Boolean(channel))
    : [];
  const fallbackChannels = [
    context.email ? { label: "Email", value: context.email } : null,
    context.phone ? { label: "Phone", value: context.phone } : null,
    context.location ? { label: "Location", value: context.location } : null,
  ].filter((channel): channel is { label: string; value: string } => Boolean(channel));

  return {
    headline: readString(content.headline) ?? "Contact",
    subheadline:
      readString(content.subheadline) ??
      "Tell us what you need and we will map next steps quickly.",
    channels:
      channels.length > 0
        ? channels
        : fallbackChannels.length > 0
          ? fallbackChannels
          : [{ label: "Email", value: "hello@example.com" }],
  };
}

function normalizeFooterContent(
  content: Record<string, unknown>,
  context: RenderFallbackContext,
): Record<string, unknown> {
  return {
    shortBlurb:
      readString(content.shortBlurb) ??
      `${context.siteTitle} helps ${context.targetAudience} with practical, high-impact work.`,
    legalText:
      readString(content.legalText) ??
      `© ${context.currentYear} ${context.siteTitle}. All rights reserved.`,
  };
}

function normalizeMarketingSection(
  section: WebsiteSection,
  context: RenderFallbackContext,
): WebsiteSection {
  const content = isRecord(section.content) ? section.content : {};

  switch (section.type) {
    case "hero":
      return { ...section, content: normalizeHeroContent(content, context), visible: true };
    case "about":
      return {
        ...section,
        content: normalizeInformationalContent(content, context, `Why ${context.siteTitle}`),
        visible: true,
      };
    case "services":
      return { ...section, content: normalizeServicesContent(content, context), visible: true };
    case "features":
      return {
        ...section,
        content: normalizeInformationalContent(content, context, "Key features"),
        visible: true,
      };
    case "benefits":
      return {
        ...section,
        content: normalizeInformationalContent(content, context, "Benefits"),
        visible: true,
      };
    case "testimonials":
      return {
        ...section,
        content: normalizeTestimonialsContent(content, context),
        visible: true,
      };
    case "pricing":
      return { ...section, content: normalizePricingContent(content, context), visible: true };
    case "faq":
      return { ...section, content: normalizeFaqContent(content, context), visible: true };
    case "cta":
      return { ...section, content: normalizeCtaContent(content, context), visible: true };
    case "contact":
      return { ...section, content: normalizeContactContent(content, context), visible: true };
    case "footer":
      return { ...section, content: normalizeFooterContent(content, context), visible: true };
    default:
      return { ...section, visible: section.visible !== false };
  }
}

function normalizeMarketingPage(
  page: WebsitePage,
  context: RenderFallbackContext,
): WebsitePage {
  const existingByType = new Map(
    page.sections
      .filter((section) => section.type !== "custom")
      .map((section) => [section.type, section]),
  );
  const sectionTypes = marketingSectionsForPage(page);
  const normalizedSections = sectionTypes.map((type, index) => {
    const section =
      existingByType.get(type) ??
      ({
        id: `render_${page.id}_${type}`,
        type,
        order: index,
        visible: true,
        content: {},
      } satisfies WebsiteSection);

    return normalizeMarketingSection(
      {
        ...section,
        order: index,
        visible: section.visible !== false,
      },
      context,
    );
  });
  const customSections = page.sections
    .filter((section) => section.type === "custom")
    .map((section, index) => ({
      ...section,
      order: normalizedSections.length + index,
      visible: section.visible !== false,
    }));

  return {
    ...page,
    visible: page.visible !== false,
    navigationLabel: derivePageNavigationLabel(page),
    navigation: page.navigation ?? {
      includeInHeader: true,
      includeInFooter: true,
      includeInSidebar: Boolean(page.parentPageId),
    },
    sections: [...normalizedSections, ...customSections],
  };
}

function normalizePageMetadata(page: WebsitePage): WebsitePage {
  return {
    ...page,
    visible: page.visible !== false,
    navigationLabel: derivePageNavigationLabel(page),
    navigation: page.navigation ?? {
      includeInHeader: true,
      includeInFooter: true,
      includeInSidebar: Boolean(page.parentPageId),
    },
    sections: page.sections.map((section, index) => ({
      ...section,
      order: index,
      visible: section.visible !== false,
    })),
  };
}

function hasStaleNavigation(structure: WebsiteStructure): boolean {
  const pageIds = new Set(structure.pages.map((page) => page.id));
  const pageSlugs = new Set(structure.pages.map((page) => page.slug));
  const primaryItems = Array.isArray(structure.navigation?.primary) ? structure.navigation.primary : [];
  const hierarchyNodes = Array.isArray(structure.navigation?.hierarchy?.nodes)
    ? structure.navigation.hierarchy.nodes
    : [];
  const visiblePages = structure.pages.filter((page) => page.visible !== false);

  if (primaryItems.length === 0) {
    return true;
  }

  if (primaryItems.some((item) => !readString(item.label))) {
    return true;
  }

  if (primaryItems.some((item) => readString(item.label)?.startsWith("/"))) {
    return true;
  }

  if (primaryItems.some((item) => item.pageId && !pageIds.has(item.pageId))) {
    return true;
  }

  if (
    primaryItems.some((item) => {
      const href = readString(item.href);
      return href?.startsWith("/") && !pageSlugs.has(href);
    })
  ) {
    return true;
  }

  if (hierarchyNodes.length !== visiblePages.length) {
    return true;
  }

  if (hierarchyNodes.some((node) => !pageIds.has(node.pageId))) {
    return true;
  }

  return false;
}

export function repairWebsiteStructureNavigation(
  structure: WebsiteStructure,
): WebsiteStructure {
  const cloned = structuredClone(structure);

  cloned.pages = cloned.pages.map((page) => normalizePageMetadata(page));

  if (hasStaleNavigation(cloned)) {
    cloned.navigation = generateNavigation(cloned.websiteType, cloned.pages, cloned.siteTitle);
  }

  return cloned;
}

export function normalizeWebsiteStructureForRender(
  structure: WebsiteStructure,
): WebsiteStructure {
  const repaired = repairWebsiteStructureNavigation(structure);

  if (!isMarketingWebsiteType(repaired.websiteType)) {
    return repaired;
  }

  const context = createFallbackContext(repaired);

  return {
    ...repaired,
    pages: repaired.pages.map((page) => normalizeMarketingPage(page, context)),
  };
}

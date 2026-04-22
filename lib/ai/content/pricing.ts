import type { WebsiteGenerationInput } from "../prompts/types";
import type { PricingSectionContent } from "./types";

export function createPricingFallback(
  input: WebsiteGenerationInput,
): PricingSectionContent {
  const baseTiers = [
    {
      name: "Starter",
      price: "$499",
      billingPeriod: "/mo",
      description: "A fast way to launch the core offer with clear messaging.",
      features: [
        "Core offer positioning",
        "Essential marketing sections",
        "Conversion-ready CTA copy",
      ],
      ctaText: input.primaryCta,
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
    {
      name: "Scale",
      price: "Custom",
      description: "For larger engagements that need custom packaging and rollout planning.",
      features: [
        "Custom conversion strategy",
        "Priority stakeholder collaboration",
        "Offer architecture support",
      ],
      ctaText: "Talk to sales",
      isFeatured: false,
    },
  ];

  const tiers =
    input.websiteType === "landing-page" ? baseTiers.slice(0, 2) : baseTiers;

  return {
    variant: tiers.length === 2 ? "two-tier" : "three-tier",
    headline: "Pricing built for clear next steps",
    subheadline: `Simple options for ${input.targetAudience} to choose the right fit.`,
    tiers,
    guaranteeLine: "Transparent scope. No inflated promises.",
    disclaimer: "Illustrative pricing placeholders — update before publishing live offers.",
    audience: input.targetAudience,
    tone: input.tone,
    density: "medium",
    goal: input.primaryCta,
  };
}

export function normalizePricingSection(
  content: Partial<PricingSectionContent> | undefined,
  input: WebsiteGenerationInput,
): PricingSectionContent {
  const fallback = createPricingFallback(input);

  const tiers =
    content?.tiers
      ?.map((tier) => ({
        name: tier.name?.trim(),
        price: tier.price?.trim(),
        billingPeriod: tier.billingPeriod?.trim(),
        description: tier.description?.trim(),
        features: tier.features?.map((feature) => feature.trim()).filter(Boolean) ?? [],
        ctaText: tier.ctaText?.trim(),
        isFeatured: Boolean(tier.isFeatured),
      }))
      .filter(
        (tier) =>
          tier.name &&
          tier.price &&
          tier.description &&
          tier.ctaText &&
          tier.features.length > 0,
      )
      .slice(0, 3) || fallback.tiers;

  return {
    variant:
      content?.variant || (tiers.length === 2 ? "two-tier" : "three-tier"),
    headline: content?.headline?.trim() || fallback.headline,
    subheadline: content?.subheadline?.trim() || fallback.subheadline,
    tiers,
    guaranteeLine: content?.guaranteeLine?.trim() || fallback.guaranteeLine,
    disclaimer: content?.disclaimer?.trim() || fallback.disclaimer,
    audience: content?.audience?.trim() || fallback.audience,
    tone: content?.tone || fallback.tone,
    density: content?.density || fallback.density,
    goal: content?.goal?.trim() || fallback.goal,
  };
}

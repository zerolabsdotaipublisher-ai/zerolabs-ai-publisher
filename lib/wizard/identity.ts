import type { WebsiteGenerationInput, WebsiteType } from "@/lib/ai/prompts/types";
import { inferWebsiteTypeFromPages, normalizeDesignConfig } from "./schemas";
import type { WebsiteWizardInput, WebsiteWizardInputPatch } from "./types";

const SECOND_LEVEL_DOMAIN_PARTS = new Set(["ac", "co", "com", "edu", "gov", "net", "org"]);
export const WEBSITE_DOMAIN_SLUG_FALLBACK = "example.com";
export const WEBSITE_BRAND_NAME_FALLBACK = "Sample Website";
export const WEBSITE_DESCRIPTION_FALLBACK = "A modern website created with Zero Labs AI Publisher.";
export const WEBSITE_TARGET_AUDIENCE_FALLBACK = "General visitors";
export const WEBSITE_SERVICES_FALLBACK = ["Sample service"];
export const WEBSITE_PRIMARY_CTA_FALLBACK = "Learn more";

function toTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function toStringList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

function hasContent(value: unknown): boolean {
  return Boolean(toTrimmedString(value));
}

function toTitleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => {
      if (part.length <= 2) {
        return part.toUpperCase();
      }

      return `${part.charAt(0).toUpperCase()}${part.slice(1)}`;
    })
    .join(" ");
}

function normalizeDomainCandidate(value: unknown): string | null {
  const trimmed = toTrimmedString(value);
  if (!trimmed || /\s/.test(trimmed)) {
    return null;
  }

  let candidate = trimmed;

  if (/^https?:\/\//i.test(candidate)) {
    try {
      candidate = new URL(candidate).hostname;
    } catch {
      return null;
    }
  } else {
    candidate = candidate.split(/[/?#]/, 1)[0] ?? candidate;
  }

  const normalized = candidate.toLowerCase().replace(/^www\./, "");
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i.test(normalized)) {
    return null;
  }

  return normalized;
}

function deriveBrandNameFromDomain(domainName: string): string {
  const parts = domainName.split(".");
  const rootIndex =
    parts.length >= 3 && SECOND_LEVEL_DOMAIN_PARTS.has(parts[parts.length - 2])
      ? parts.length - 3
      : parts.length - 2;
  const label = parts[Math.max(rootIndex, 0)] ?? domainName;
  return toTitleCase(label);
}

function defaultPrimaryCtaForWebsiteType(websiteType: WebsiteType): string {
  void websiteType;
  return WEBSITE_PRIMARY_CTA_FALLBACK;
}

function defaultServiceForWebsiteType(websiteType: WebsiteType): string {
  void websiteType;
  return WEBSITE_SERVICES_FALLBACK[0];
}

export function resolveWebsiteIdentity(
  input: Pick<WebsiteWizardInput, "websiteIdentity" | "brandName" | "domainName">,
): {
  brandName: string;
  domainName: string;
} {
  const websiteIdentity = toTrimmedString(input.websiteIdentity);
  const domainName = normalizeDomainCandidate(input.domainName) ?? "";
  const brandName = toTrimmedString(input.brandName);

  if (brandName) {
    return { brandName, domainName };
  }

  if (domainName) {
    return {
      brandName: deriveBrandNameFromDomain(domainName),
      domainName,
    };
  }

  if (websiteIdentity) {
    const derivedDomainName = normalizeDomainCandidate(websiteIdentity);
    if (derivedDomainName) {
      return {
        brandName: deriveBrandNameFromDomain(derivedDomainName),
        domainName: derivedDomainName,
      };
    }

    return {
      brandName: websiteIdentity,
      domainName: "",
    };
  }

  return { brandName: "", domainName: "" };
}

export function buildWebsiteIdentityPatch(
  value: string,
): Pick<WebsiteWizardInputPatch, "websiteIdentity" | "brandName" | "domainName"> {
  const trimmed = toTrimmedString(value);
  if (!trimmed) {
    return {
      websiteIdentity: "",
      brandName: "",
      domainName: "",
    };
  }

  const domainName = normalizeDomainCandidate(trimmed);
  if (!domainName) {
    return {
      websiteIdentity: trimmed,
      brandName: trimmed,
      domainName: "",
    };
  }

  return {
    websiteIdentity: trimmed,
    brandName: deriveBrandNameFromDomain(domainName),
    domainName,
  };
}

export function getWebsiteIdentityValue(
  input: Pick<WebsiteWizardInput, "websiteIdentity" | "brandName" | "domainName">,
): string {
  if (hasContent(input.websiteIdentity)) {
    return toTrimmedString(input.websiteIdentity);
  }

  return hasContent(input.domainName)
    ? toTrimmedString(input.domainName)
    : toTrimmedString(input.brandName);
}

export function getWebsiteDomainSlugValue(input: Pick<WebsiteWizardInput, "domainName">): string {
  return hasContent(input.domainName) ? toTrimmedString(input.domainName) : WEBSITE_DOMAIN_SLUG_FALLBACK;
}

export function createGeneratedWebsiteBrief(
  input: WebsiteWizardInput,
): Pick<WebsiteGenerationInput, "brandName" | "description" | "primaryCta" | "services" | "targetAudience"> {
  const designConfig = normalizeDesignConfig(input.designConfig);
  const websiteType = inferWebsiteTypeFromPages(designConfig.pages);
  const identity = resolveWebsiteIdentity(input);
  const brandName = identity.brandName || WEBSITE_BRAND_NAME_FALLBACK;
  const trimmedServices = toStringList(input.services);

  return {
    brandName,
    description: toTrimmedString(input.description) || WEBSITE_DESCRIPTION_FALLBACK,
    targetAudience: toTrimmedString(input.targetAudience) || WEBSITE_TARGET_AUDIENCE_FALLBACK,
    primaryCta: toTrimmedString(input.primaryCta) || defaultPrimaryCtaForWebsiteType(websiteType),
    services:
      trimmedServices.length > 0 ? trimmedServices : [defaultServiceForWebsiteType(websiteType)],
  };
}

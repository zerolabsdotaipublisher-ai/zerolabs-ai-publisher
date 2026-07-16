import type { WebsiteStructure } from "@/lib/ai/structure";
import { buildWebsiteRouting } from "./mapping";
import type { WebsiteRoutingConfig } from "./types";

function isRoutingConfigShapeValid(value: WebsiteStructure["routing"]): value is WebsiteRoutingConfig {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<WebsiteRoutingConfig>;
  return (
    Array.isArray(candidate.routes) &&
    Array.isArray(candidate.redirects) &&
    Array.isArray(candidate.reservedPaths) &&
    Boolean(candidate.urls && typeof candidate.urls === "object")
  );
}

export function getWebsiteRoutingConfig(structure: WebsiteStructure): WebsiteRoutingConfig {
  if (isRoutingConfigShapeValid(structure.routing)) {
    return structure.routing;
  }

  return buildWebsiteRouting(structure).routing;
}

export function withRegeneratedWebsiteRouting(
  structure: WebsiteStructure,
  now = new Date().toISOString(),
): { structure: WebsiteStructure; validationErrors: string[] } {
  const generated = buildWebsiteRouting(structure, now);
  return {
    structure: generated.structure,
    validationErrors: generated.validationErrors,
  };
}

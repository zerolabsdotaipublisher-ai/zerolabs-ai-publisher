import type { WebsiteStructure } from "@/lib/ai/structure";
import { buildWebsiteRouting } from "./mapping";
import type { WebsiteRoutingConfig } from "./types";

export function getWebsiteRoutingConfig(structure: WebsiteStructure): WebsiteRoutingConfig {
  if (structure.routing) {
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

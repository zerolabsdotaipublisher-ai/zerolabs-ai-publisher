import "server-only";

import type { PipelineHostingSecurityMetadata } from "../types";

export function createHostingSecurityMetadata(): PipelineHostingSecurityMetadata {
  return {
    httpsOnly: true,
    tlsManagedByProvider: true,
    publicAccess: "public",
  };
}

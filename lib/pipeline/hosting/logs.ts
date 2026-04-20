import "server-only";

import type { PipelineHostingLogEntry, PipelineHostingLogLevel } from "../types";

export function createHostingLog(
  message: string,
  params?: {
    level?: PipelineHostingLogLevel;
    details?: Record<string, unknown>;
  },
): PipelineHostingLogEntry {
  return {
    at: new Date().toISOString(),
    level: params?.level ?? "info",
    message,
    details: params?.details,
  };
}

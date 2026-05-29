import { logger } from "@/lib/observability";
import type { RegenerationMetricsEvent } from "./types";

export async function emitRegenerationMetric(input: {
  event: RegenerationMetricsEvent;
  userId: string;
  contentId: string;
  contentType: string;
  mode?: string;
  level?: string;
  status?: string;
  error?: string;
}): Promise<void> {
  logger.info("regeneration workflow event", {
    category: "request",
    service: "regeneration",
    event: input.event,
    userId: input.userId,
    contentId: input.contentId,
    contentType: input.contentType,
    mode: input.mode,
    level: input.level,
    status: input.status,
    errorMessage: input.error,
  });
}

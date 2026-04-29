import { type NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { logger } from "@/lib/observability";
import { executeDueContentSchedules } from "@/lib/scheduling";
import { executeDueInstagramPublishJobs } from "@/lib/social/instagram";

function readBearerToken(request: NextRequest): string | undefined {
  const header = request.headers.get("authorization");
  if (!header) {
    return undefined;
  }

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const expectedToken = config.services.scheduler.executionToken;
  if (!expectedToken) {
    return NextResponse.json(
      { ok: false, error: "Scheduler execution token is not configured." },
      { status: 503 },
    );
  }

  const providedToken = readBearerToken(request);
  if (!providedToken || providedToken !== expectedToken) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const [contentSchedulesResult, instagramPublishResult] = await Promise.allSettled([
    executeDueContentSchedules(config.services.scheduler.batchSize),
    executeDueInstagramPublishJobs(config.services.scheduler.batchSize),
  ]);

  const contentSchedules =
    contentSchedulesResult.status === "fulfilled"
      ? contentSchedulesResult.value
      : { claimedCount: 0, processedCount: 0, schedules: [] };
  const instagramPublish =
    instagramPublishResult.status === "fulfilled"
      ? instagramPublishResult.value
      : { claimedCount: 0, processedCount: 0, jobs: [] };

  if (contentSchedulesResult.status === "rejected") {
    logger.error("Scheduler content execution failed", {
      category: "error",
      service: "scheduling",
      error: {
        name: "ContentScheduleBatchExecutionError",
        message:
          contentSchedulesResult.reason instanceof Error
            ? contentSchedulesResult.reason.message
            : "Unknown error",
      },
    });
  }

  if (instagramPublishResult.status === "rejected") {
    logger.error("Scheduler instagram execution failed", {
      category: "error",
      service: "instagram",
      error: {
        name: "InstagramScheduleBatchExecutionError",
        message:
          instagramPublishResult.reason instanceof Error
            ? instagramPublishResult.reason.message
            : "Unknown error",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    result: {
      contentSchedules,
      instagramPublish,
    },
  });
}

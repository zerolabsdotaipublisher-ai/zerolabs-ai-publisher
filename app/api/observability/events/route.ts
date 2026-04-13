import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { logger } from "@/lib/observability";

const allowedEvents = new Set([
  "generation_started",
  "generation_completed",
  "generation_failed",
  "generation_retry_clicked",
  "generation_preview_opened",
  "generation_edit_inputs_clicked",
  "publish_started",
  "publish_completed",
  "publish_failed",
  "publish_retry_clicked",
  "update_completed",
]);

interface EventBody {
  event?: string;
  structureId?: string;
  status?: string;
  retryCount?: number;
  message?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: EventBody;

  try {
    body = (await request.json()) as EventBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.event || !allowedEvents.has(body.event)) {
    return NextResponse.json({ error: "Unsupported event" }, { status: 400 });
  }

  logger.info("generation interface event", {
    category: "request",
    service: "generation-interface",
    event: body.event,
    structureId: body.structureId,
    status: body.status,
    retryCount: body.retryCount,
    message: body.message,
  });

  return NextResponse.json({ ok: true });
}

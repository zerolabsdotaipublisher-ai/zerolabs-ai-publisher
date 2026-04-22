import { type NextRequest, NextResponse } from "next/server";
import { config } from "@/config";
import { executeDueContentSchedules } from "@/lib/scheduling";

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

  const result = await executeDueContentSchedules(config.services.scheduler.batchSize);
  return NextResponse.json({
    ok: true,
    result,
  });
}

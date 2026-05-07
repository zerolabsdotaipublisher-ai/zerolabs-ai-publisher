import { type NextRequest, NextResponse } from "next/server";
import { parseManualOverrideBody, runManualOverrideWorkflow } from "@/lib/publish/override";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  let parsed;
  try {
    parsed = parseManualOverrideBody(body);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Invalid override payload.",
      },
      { status: 400 },
    );
  }

  const result = await runManualOverrideWorkflow({
    user,
    input: parsed,
  });

  const status = result.ok
    ? 200
    : result.error?.includes("Unauthorized") || result.error?.includes("requires")
      ? 403
      : result.error?.includes("not found")
        ? 404
        : result.error?.includes("blocked")
          ? 409
          : 422;

  return NextResponse.json(result, { status });
}

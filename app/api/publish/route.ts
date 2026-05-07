import { type NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase/server";
import { getOwnedPublishStructure } from "@/lib/publish/storage";
import { runPublishWorkflow } from "@/lib/publish/workflow";
import { getStructureReviewPublishingGate } from "@/lib/review";

interface PublishBody {
  structureId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: PublishBody;
  try {
    body = (await request.json()) as PublishBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.structureId?.trim()) {
    return NextResponse.json({ ok: false, error: "structureId is required" }, { status: 400 });
  }

  const structure = await getOwnedPublishStructure(body.structureId, user.id);
  if (!structure) {
    return NextResponse.json({ ok: false, error: "Structure not found" }, { status: 404 });
  }

  const reviewGate = await getStructureReviewPublishingGate(user.id, body.structureId);
  if (reviewGate.blocked) {
    return NextResponse.json(
      {
        ok: false,
        error: reviewGate.reason || "Publishing is blocked by review state.",
        reviewGate,
      },
      { status: 409 },
    );
  }

  const result = await runPublishWorkflow({
    structure,
    userId: user.id,
    action: "publish",
  });

  const status = result.ok
    ? 200
    : result.error === "You do not have permission to publish this website."
      ? 403
      : result.validation && !result.validation.eligible
        ? 422
        : result.error === "A publish operation is already in progress."
            || result.error === "Another deployment update request won the race. Refresh and try again."
          ? 409
          : 500;
  return NextResponse.json(result, { status });
}

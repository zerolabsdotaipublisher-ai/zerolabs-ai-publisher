import { NextResponse } from "next/server";
import { retrySocialPublishFromHistory } from "@/lib/social/history";
import { getServerUser } from "@/lib/supabase/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  _request: Request,
  { params }: RouteContext,
): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const result = await retrySocialPublishFromHistory(id, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to retry social publish";
    return NextResponse.json({ ok: false, error: message }, { status: 422 });
  }
}

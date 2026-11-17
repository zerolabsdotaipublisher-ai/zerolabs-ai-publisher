import { NextResponse } from "next/server";
import { followProfile, unfollowProfile } from "@/app/(app)/profile/actions";

async function readTargetUserId(request: Request): Promise<string | null> {
  try {
    const body = await request.json();
    return body && typeof body.targetUserId === "string" ? body.targetUserId : null;
  } catch {
    return null;
  }
}

function actionResponse(result: { success: true } | { error: string }) {
  if ("success" in result) return NextResponse.json(result);

  const status = result.error.startsWith("Sign in") ? 401 : 400;
  return NextResponse.json(result, { status });
}

/** Browser mutation boundary; identity remains derived from the server session. */
export async function POST(request: Request) {
  const targetUserId = await readTargetUserId(request);
  if (!targetUserId) return NextResponse.json({ error: "Choose a valid profile to follow." }, { status: 400 });
  return actionResponse(await followProfile(targetUserId));
}

export async function DELETE(request: Request) {
  const targetUserId = await readTargetUserId(request);
  if (!targetUserId) return NextResponse.json({ error: "Choose a valid profile to unfollow." }, { status: 400 });
  return actionResponse(await unfollowProfile(targetUserId));
}

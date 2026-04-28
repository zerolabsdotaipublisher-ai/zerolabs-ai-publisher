import { type NextRequest, NextResponse } from "next/server";
import { buildSocialPreviewResponse, getSocialPostById } from "@/lib/social";
import { getServerUser } from "@/lib/supabase/server";

async function handlePreview(postId: string, userId: string): Promise<NextResponse> {
  if (!postId.trim()) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const socialPost = await getSocialPostById(postId, userId);
  if (!socialPost) {
    return NextResponse.json({ error: "Social post not found" }, { status: 404 });
  }

  return NextResponse.json(buildSocialPreviewResponse(socialPost));
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const postId = request.nextUrl.searchParams.get("postId") ?? "";
  return handlePreview(postId, user.id);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { postId?: string };
  try {
    body = (await request.json()) as { postId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.postId) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  return handlePreview(body.postId, user.id);
}

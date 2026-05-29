import { type NextRequest, NextResponse } from "next/server";
import {
  getSocialPostById,
  normalizeSocialPost,
  type GeneratedSocialPost,
  upsertSocialPost,
  validateGeneratedSocialPost,
} from "@/lib/social";
import { getServerUser } from "@/lib/supabase/server";

interface SaveSocialBody {
  postId?: string;
  socialPost?: GeneratedSocialPost;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: SaveSocialBody;
  try {
    body = (await request.json()) as SaveSocialBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.postId?.trim() || !body.socialPost) {
    return NextResponse.json({ error: "postId and socialPost are required" }, { status: 400 });
  }

  const existingPost = await getSocialPostById(body.postId, user.id);
  if (!existingPost) {
    return NextResponse.json({ error: "Social post not found" }, { status: 404 });
  }

  const normalized = normalizeSocialPost({
    ...existingPost,
    ...body.socialPost,
    id: existingPost.id,
    userId: existingPost.userId,
    structureId: existingPost.structureId,
    sourceType: existingPost.sourceType,
    sourceSnapshot: existingPost.sourceSnapshot,
    generatedAt: existingPost.generatedAt,
    updatedAt: new Date().toISOString(),
    version: existingPost.version + 1,
  });

  const validationErrors = validateGeneratedSocialPost(normalized);
  if (validationErrors.length > 0) {
    return NextResponse.json({ error: "Invalid social post", validationErrors }, { status: 422 });
  }

  const stored = await upsertSocialPost(normalized, user.id);
  return NextResponse.json({ ok: true, socialPost: stored, validationErrors: [] });
}

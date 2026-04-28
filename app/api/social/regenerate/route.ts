import { type NextRequest, NextResponse } from "next/server";
import {
  getSocialPostById,
  regenerateSocialPost,
  type SocialGenerationInput,
  type SocialPlatform,
  upsertSocialPost,
} from "@/lib/social";
import { getServerUser } from "@/lib/supabase/server";

interface RegenerateSocialBody {
  postId?: string;
  platform?: SocialPlatform;
  reason?: string;
  updatedInput?: Partial<SocialGenerationInput>;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RegenerateSocialBody;
  try {
    body = (await request.json()) as RegenerateSocialBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.postId?.trim()) {
    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  }

  const existingPost = await getSocialPostById(body.postId, user.id);
  if (!existingPost) {
    return NextResponse.json({ error: "Social post not found" }, { status: 404 });
  }

  try {
    const regenerated = await regenerateSocialPost(existingPost, user.id, {
      platform: body.platform,
      reason: body.reason,
      updatedInput: body.updatedInput,
    });
    const stored = await upsertSocialPost(regenerated.socialPost, user.id);

    return NextResponse.json({
      socialPost: stored,
      usedFallback: regenerated.usedFallback,
      validationErrors: regenerated.validationErrors,
    });
  } catch {
    return NextResponse.json({ error: "Social post regeneration failed" }, { status: 500 });
  }
}

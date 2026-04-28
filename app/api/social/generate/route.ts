import { type NextRequest, NextResponse } from "next/server";
import {
  generateSocialPost,
  sanitizeSocialGenerationInput,
  upsertSocialPost,
  validateSocialGenerationInput,
} from "@/lib/social";
import { getServerUser } from "@/lib/supabase/server";

export async function POST(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const input = sanitizeSocialGenerationInput(body as Parameters<typeof sanitizeSocialGenerationInput>[0]);
  const errors = validateSocialGenerationInput(input);
  if (errors.length > 0) {
    return NextResponse.json({ error: "Invalid input", details: errors }, { status: 422 });
  }

  try {
    const result = await generateSocialPost(input, user.id);
    const stored = await upsertSocialPost(result.socialPost, user.id);

    return NextResponse.json({
      socialPost: stored,
      usedFallback: result.usedFallback,
      validationErrors: result.validationErrors,
    });
  } catch {
    return NextResponse.json({ error: "Social post generation failed" }, { status: 500 });
  }
}

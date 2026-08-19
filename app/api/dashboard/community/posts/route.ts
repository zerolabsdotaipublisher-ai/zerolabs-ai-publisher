import { NextResponse } from "next/server";
import { createCommunityPost } from "@/lib/community/storage";
import { requireUser } from "@/lib/supabase/auth";
import { routes } from "@/config/routes";

export async function POST(req: Request) {
  try {
    await requireUser(routes.dashboard);
    const body = await req.json();
    const post = await createCommunityPost(body);
    return NextResponse.json(post);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

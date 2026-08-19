import { NextResponse } from "next/server";
import { saveCommunityItem, unsaveCommunityItem } from "@/lib/community/storage";
import { requireUser } from "@/lib/supabase/auth";
import { routes } from "@/config/routes";

export async function POST(req: Request) {
  try {
    await requireUser(routes.dashboard);
    const body = await req.json();
    const item = await saveCommunityItem(body);
    return NextResponse.json(item);
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    await requireUser(routes.dashboard);
    const body = await req.json();
    await unsaveCommunityItem(body);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

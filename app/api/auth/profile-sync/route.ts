import { NextResponse } from "next/server";
import { syncProfileFromAuthUser } from "@/lib/supabase/profile";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(): Promise<NextResponse> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  await syncProfileFromAuthUser(user);

  return NextResponse.json({ success: true });
}

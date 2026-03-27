import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(): Promise<NextResponse> {
  const supabase = await getSupabaseServerClient();
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}

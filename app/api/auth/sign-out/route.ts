import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(): Promise<NextResponse> {
  const supabase = await getSupabaseServerClient();

  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: "Unable to sign out." }, { status: 500 });
    }
  } catch {
    return NextResponse.json({ error: "Unable to sign out." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

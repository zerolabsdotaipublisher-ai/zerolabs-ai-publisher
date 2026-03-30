/**
 * Profile API — GET /api/profile · PATCH /api/profile
 *
 * GET  — return the authenticated user's profile row.
 * PATCH — update editable fields (full_name, avatar_url).
 *
 * Both methods require an active session.  The service-role client is used
 * internally but the route itself gates access on the session user ID, so
 * only the authenticated user can read or modify their own profile.
 */

import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getProfile, updateProfile, type ProfileUpdateData } from "@/lib/supabase/profile";
import { logger } from "@/lib/observability";

export async function GET(): Promise<NextResponse> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profile = await getProfile(user.id);

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({ profile });
  } catch (err) {
    logger.error("GET /api/profile failed", {
      category: "error",
      service: "supabase",
      userId: user.id,
      error: { message: err instanceof Error ? err.message : String(err), name: "ProfileApiError" },
    });
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Request body must be a JSON object" }, { status: 400 });
  }

  // Extract and validate only the permitted editable fields.
  const raw = body as Record<string, unknown>;
  const data: ProfileUpdateData = {};

  if ("full_name" in raw) {
    if (raw.full_name !== null && typeof raw.full_name !== "string") {
      return NextResponse.json({ error: "full_name must be a string or null" }, { status: 400 });
    }
    data.full_name = (raw.full_name as string | null) ?? null;
  }

  if ("avatar_url" in raw) {
    if (raw.avatar_url !== null && typeof raw.avatar_url !== "string") {
      return NextResponse.json({ error: "avatar_url must be a string or null" }, { status: 400 });
    }
    data.avatar_url = (raw.avatar_url as string | null) ?? null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
  }

  try {
    const profile = await updateProfile(user.id, data);
    return NextResponse.json({ profile });
  } catch (err) {
    logger.error("PATCH /api/profile failed", {
      category: "error",
      service: "supabase",
      userId: user.id,
      error: { message: err instanceof Error ? err.message : String(err), name: "ProfileApiError" },
    });
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { config } from "@/config";

export async function getSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(config.services.supabase.url, config.services.supabase.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const cookie of cookiesToSet) {
            cookieStore.set(cookie.name, cookie.value, cookie.options);
          }
        } catch {
          // Cookies cannot always be set in Server Components.
        }
      },
    },
  });
}

export function getSupabaseServiceClient(): SupabaseClient {
  return createClient(config.services.supabase.url, config.services.supabase.serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function getServerUser(): Promise<User | null> {
  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return data.user;
}

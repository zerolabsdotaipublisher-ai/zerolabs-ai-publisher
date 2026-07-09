import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { config } from "@/config";

export type SupabaseServiceRoleStatus = "ready" | "missing" | "invalid" | "wrong-project";

export interface SupabaseServiceRoleInspection {
  status: SupabaseServiceRoleStatus;
  configuredProjectRef: string | null;
  keyProjectRef: string | null;
  roleClaim: string | null;
}

export class SupabaseServiceRoleError extends Error {
  readonly status: Exclude<SupabaseServiceRoleStatus, "ready">;

  constructor(status: Exclude<SupabaseServiceRoleStatus, "ready">) {
    super(
      status === "missing"
        ? "Supabase service-role configuration is missing."
        : status === "wrong-project"
          ? "Supabase service-role configuration points at a different Supabase project."
          : "Supabase service-role configuration is invalid."
    );

    this.name = "SupabaseServiceRoleError";
    this.status = status;
  }
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const segments = token.split(".");

  if (segments.length !== 3) {
    return null;
  }

  try {
    const normalized = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const decoded = Buffer.from(padded, "base64").toString("utf8");
    const payload = JSON.parse(decoded);

    return payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function extractProjectRef(value: string | null | undefined): string | null {
  const input = readString(value);

  if (!input) {
    return null;
  }

  try {
    const url = new URL(input.startsWith("http://") || input.startsWith("https://") ? input : `https://${input}`);
    const hostname = url.hostname.trim().toLowerCase();
    const [subdomain] = hostname.split(".");

    return subdomain || null;
  } catch {
    return null;
  }
}

export function inspectSupabaseServiceRoleConfiguration(): SupabaseServiceRoleInspection {
  const configuredProjectRef = extractProjectRef(config.services.supabase.url);
  const serviceRole = readString(process.env.SUPABASE_SERVICE_ROLE_KEY ?? config.services.supabase.serviceRole);

  if (!serviceRole || serviceRole === "your_supabase_service_role_key") {
    return {
      status: "missing",
      configuredProjectRef,
      keyProjectRef: null,
      roleClaim: null,
    };
  }

  const payload = decodeJwtPayload(serviceRole);
  if (!payload) {
    return {
      status: "invalid",
      configuredProjectRef,
      keyProjectRef: null,
      roleClaim: null,
    };
  }

  const roleClaim = readString(payload.role);
  const keyProjectRef = extractProjectRef(readString(payload.iss)) ?? readString(payload.ref);

  if (roleClaim !== "service_role") {
    return {
      status: "invalid",
      configuredProjectRef,
      keyProjectRef,
      roleClaim,
    };
  }

  if (configuredProjectRef && keyProjectRef && configuredProjectRef !== keyProjectRef) {
    return {
      status: "wrong-project",
      configuredProjectRef,
      keyProjectRef,
      roleClaim,
    };
  }

  return {
    status: "ready",
    configuredProjectRef,
    keyProjectRef,
    roleClaim,
  };
}

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
  const inspection = inspectSupabaseServiceRoleConfiguration();

  if (inspection.status !== "ready") {
    throw new SupabaseServiceRoleError(inspection.status);
  }

  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY ?? config.services.supabase.serviceRole;

  return createClient(config.services.supabase.url, serviceRole, {
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

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { config, type RuntimeEnvironment } from "@/config";

export type SupabaseServiceRoleStatus = "ready" | "missing" | "invalid" | "wrong-project";
export type SupabaseServiceRoleKeyFormat = "legacy-jwt" | "sb-secret" | "invalid" | "missing";

export interface SupabaseServiceRoleInspection {
  status: SupabaseServiceRoleStatus;
  publicProjectRef: string | null;
  serviceRoleProjectRef: string | null;
  roleClaim: string | null;
  keyFormat: SupabaseServiceRoleKeyFormat;
  environment: RuntimeEnvironment;
  message: string | null;
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

function normalizeProjectRef(value: string | null | undefined): string | null {
  const input = readString(value)?.toLowerCase();

  if (!input || !/^[a-z0-9]{20}$/.test(input)) {
    return null;
  }

  return input;
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

function extractProjectRefFromUrl(value: string | null | undefined): string | null {
  const input = readString(value);

  if (!input) {
    return null;
  }

  try {
    const url = new URL(input.startsWith("http://") || input.startsWith("https://") ? input : `https://${input}`);
    const hostname = url.hostname.trim().toLowerCase();
    const [subdomain] = hostname.split(".");

    return normalizeProjectRef(subdomain);
  } catch {
    return normalizeProjectRef(input);
  }
}

function detectServiceRoleKeyFormat(value: string | null): SupabaseServiceRoleKeyFormat {
  if (!value) {
    return "missing";
  }

  if (value.startsWith("sb_secret_")) {
    return "sb-secret";
  }

  if (value.startsWith("eyJ") || value.split(".").length === 3) {
    return "legacy-jwt";
  }

  return "invalid";
}

function buildWrongProjectMessage(
  publicProjectRef: string,
  serviceRoleProjectRef: string,
): string {
  return `Vercel is reading a service-role key for ${serviceRoleProjectRef}, but NEXT_PUBLIC_SUPABASE_URL points to ${publicProjectRef}. Update the Vercel variable for the environment currently being tested.`;
}

function createInspection(
  status: SupabaseServiceRoleStatus,
  {
    publicProjectRef,
    serviceRoleProjectRef = null,
    roleClaim = null,
    keyFormat,
    environment,
    message = null,
  }: {
    publicProjectRef: string | null;
    serviceRoleProjectRef?: string | null;
    roleClaim?: string | null;
    keyFormat: SupabaseServiceRoleKeyFormat;
    environment: RuntimeEnvironment;
    message?: string | null;
  },
): SupabaseServiceRoleInspection {
  return {
    status,
    publicProjectRef,
    serviceRoleProjectRef,
    roleClaim,
    keyFormat,
    environment,
    message,
  };
}

export function inspectSupabaseServiceRoleConfiguration(): SupabaseServiceRoleInspection {
  const publicProjectRef = extractProjectRefFromUrl(config.services.supabase.url);
  const serviceRole = readString(config.services.supabase.serviceRole);
  const keyFormat = detectServiceRoleKeyFormat(serviceRole);
  const environment = config.app.environment;

  if (!serviceRole || serviceRole === "your_supabase_service_role_key") {
    return createInspection("missing", {
      publicProjectRef,
      keyFormat: "missing",
      environment,
    });
  }

  if (keyFormat === "invalid") {
    return createInspection("invalid", {
      publicProjectRef,
      keyFormat,
      environment,
    });
  }

  if (keyFormat === "sb-secret") {
    return createInspection("ready", {
      publicProjectRef,
      keyFormat,
      environment,
    });
  }

  const payload = decodeJwtPayload(serviceRole);
  if (!payload) {
    return createInspection("invalid", {
      publicProjectRef,
      keyFormat,
      environment,
    });
  }

  const roleClaim = readString(payload.role);
  const serviceRoleProjectRef =
    extractProjectRefFromUrl(readString(payload.iss)) ?? normalizeProjectRef(readString(payload.ref));

  if (roleClaim !== "service_role") {
    return createInspection("invalid", {
      publicProjectRef,
      serviceRoleProjectRef,
      roleClaim,
      keyFormat,
      environment,
    });
  }

  if (publicProjectRef && serviceRoleProjectRef && publicProjectRef !== serviceRoleProjectRef) {
    return createInspection("wrong-project", {
      publicProjectRef,
      serviceRoleProjectRef,
      roleClaim,
      keyFormat,
      environment,
      message: buildWrongProjectMessage(publicProjectRef, serviceRoleProjectRef),
    });
  }

  return createInspection("ready", {
    publicProjectRef,
    serviceRoleProjectRef,
    roleClaim,
    keyFormat,
    environment,
  });
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

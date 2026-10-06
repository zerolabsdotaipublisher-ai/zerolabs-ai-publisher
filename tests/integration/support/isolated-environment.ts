import { execFile, spawnSync } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const REQUIRED_TEST_VALUES = [
  "ZERO_TEST_SUPABASE_URL",
  "ZERO_TEST_SUPABASE_ANON_KEY",
  "ZERO_TEST_SUPABASE_SERVICE_ROLE_KEY",
  "ZERO_TEST_DATABASE_URL",
] as const;

const REJECTED_ENVIRONMENTS = new Set(["prod", "production", "qa"]);
type EnvironmentValues = Record<string, string | undefined>;

export interface IsolatedTestTarget {
  supabaseUrl: string;
  anonKey: string;
  serviceRoleKey: string;
  databaseUrl: string;
  kind: "local" | "dedicated";
}

export type IsolatedTestEnvironment =
  | { available: true; target: IsolatedTestTarget }
  | { available: false; reason: string };

function value(source: EnvironmentValues, key: string): string | undefined {
  const candidate = source[key]?.trim();
  return candidate ? candidate : undefined;
}

function isPlaceholder(candidate: string): boolean {
  return /your_|replace_with|example\.supabase\.co/i.test(candidate);
}

function urlHost(candidate: string): string | undefined {
  try {
    return new URL(candidate).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

function isLocalUrl(candidate: string): boolean {
  const host = urlHost(candidate);
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function unavailable(reason: string): IsolatedTestEnvironment {
  return { available: false, reason };
}

/**
 * Validates an integration target before any destructive test setup occurs.
 * It intentionally reads only ZERO_TEST_* values for the target and rejects
 * any value shared with normal application credentials.
 */
export function resolveIsolatedTestEnvironment(
  source: EnvironmentValues = process.env,
): IsolatedTestEnvironment {
  const marker = value(source, "ZERO_ENV")?.toLowerCase();
  if (!marker) {
    return unavailable("ZERO_ENV=test is required before isolated database setup can run.");
  }
  if (REJECTED_ENVIRONMENTS.has(marker)) {
    return unavailable(`ZERO_ENV=${marker} is never permitted for destructive integration setup.`);
  }
  if (marker !== "test") {
    return unavailable("Only ZERO_ENV=test is permitted for destructive integration setup.");
  }

  const missing = REQUIRED_TEST_VALUES.filter((key) => !value(source, key));
  if (missing.length > 0) {
    return unavailable(`Missing isolated test configuration: ${missing.join(", ")}.`);
  }

  const supabaseUrl = value(source, "ZERO_TEST_SUPABASE_URL")!;
  const anonKey = value(source, "ZERO_TEST_SUPABASE_ANON_KEY")!;
  const serviceRoleKey = value(source, "ZERO_TEST_SUPABASE_SERVICE_ROLE_KEY")!;
  const databaseUrl = value(source, "ZERO_TEST_DATABASE_URL")!;
  if ([supabaseUrl, anonKey, serviceRoleKey, databaseUrl].some(isPlaceholder)) {
    return unavailable("Placeholder credentials are not valid isolated test configuration.");
  }
  if (!urlHost(supabaseUrl) || !urlHost(databaseUrl)) {
    return unavailable("ZERO_TEST_SUPABASE_URL and ZERO_TEST_DATABASE_URL must be valid URLs.");
  }

  const applicationSupabaseUrl = value(source, "NEXT_PUBLIC_SUPABASE_URL");
  const applicationAnonKey = value(source, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const applicationServiceRole = value(source, "SUPABASE_SERVICE_ROLE_KEY");
  const applicationDatabaseUrl = value(source, "DATABASE_URL") ?? value(source, "DIRECT_URL");
  if (
    (applicationSupabaseUrl && applicationSupabaseUrl === supabaseUrl) ||
    (applicationAnonKey && applicationAnonKey === anonKey) ||
    (applicationServiceRole && applicationServiceRole === serviceRoleKey) ||
    (applicationDatabaseUrl && applicationDatabaseUrl === databaseUrl)
  ) {
    return unavailable("Isolated test credentials must not match normal application credentials.");
  }

  if (isLocalUrl(supabaseUrl) && isLocalUrl(databaseUrl)) {
    return {
      available: true,
      target: { supabaseUrl, anonKey, serviceRoleKey, databaseUrl, kind: "local" },
    };
  }

  if (value(source, "ZERO_TEST_PROJECT") !== "dedicated") {
    return unavailable("A remote target requires ZERO_TEST_PROJECT=dedicated.");
  }

  return {
    available: true,
    target: { supabaseUrl, anonKey, serviceRoleKey, databaseUrl, kind: "dedicated" },
  };
}

export function isPsqlAvailable(): boolean {
  const result = spawnSync("psql", ["--version"], {
    stdio: "ignore",
    windowsHide: true,
  });
  return result.status === 0;
}

function psqlEnvironment(): NodeJS.ProcessEnv {
  const keys = ["PATH", "SYSTEMROOT", "WINDIR", "COMSPEC", "PATHEXT", "HOME", "USERPROFILE"];
  const environment: EnvironmentValues = {};
  keys.forEach((key) => {
    if (process.env[key]) environment[key] = process.env[key];
  });
  return environment as NodeJS.ProcessEnv;
}

async function runPsql(databaseUrl: string, args: string[]): Promise<void> {
  try {
    await execFileAsync("psql", ["--no-psqlrc", "--set", "ON_ERROR_STOP=1", "--dbname", databaseUrl, ...args], {
      env: psqlEnvironment(),
      windowsHide: true,
    });
  } catch {
    // Do not include psql stderr: a connection URI can carry a password.
    throw new Error("Unable to prepare the isolated Supabase/Postgres test schema.");
  }
}

export async function applyIsolatedAtomicTestSchema(target: IsolatedTestTarget): Promise<void> {
  const schemaFile = path.resolve(import.meta.dirname, "../editor-save/isolated-atomic-schema.sql");
  await runPsql(target.databaseUrl, ["--file", schemaFile]);
}

export async function removeIsolatedAtomicTestSchema(target: IsolatedTestTarget): Promise<void> {
  await runPsql(target.databaseUrl, [
    "--command",
    "drop schema if exists zero_slice3b cascade; drop function if exists public.zero_slice3b_seed_structure(uuid, uuid, jsonb); drop function if exists public.zero_slice3b_set_failpoint(uuid, text); drop function if exists public.zero_slice3b_clear_failpoint(uuid); drop function if exists public.zero_slice3b_legacy_touch(uuid); drop function if exists public.zero_slice3b_read_state(uuid); drop function if exists public.zero_slice3b_security_contract(); drop function if exists public.save_editor_document(uuid, bigint, jsonb, jsonb, jsonb, jsonb, text);",
  ]);
}

/**
 * Centralized environment variable access.
 *
 * This module is the single source of truth for reading process.env in the
 * application. All environment variable access must go through this module —
 * never read process.env directly in other files.
 *
 * Variables without a NEXT_PUBLIC_ prefix are server-only and are stripped
 * from client bundles by Next.js. Only import this module in server-side code
 * (API routes, Server Components, server actions, next.config.ts).
 *
 * See docs/environment-variables.md for the full variable reference.
 */

function required(key: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
        `Copy .env.example to .env.local and set a value for ${key}.\n` +
        `See docs/environment-variables.md for the full reference.`
    );
  }
  return value;
}

function optional(value: string | undefined, fallback?: string): string | undefined {
  return value !== undefined && value !== "" ? value : fallback;
}

/**
 * Required variables validated at startup via validateEnv().
 * Each entry must have a corresponding required() call in the env object below.
 */
const REQUIRED_VARS = [
  "NEXT_PUBLIC_APP_NAME",
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
] as const;

export const env = {
  /** Application identity */
  app: {
    name: required("NEXT_PUBLIC_APP_NAME", process.env.NEXT_PUBLIC_APP_NAME),
    url: required("NEXT_PUBLIC_APP_URL", process.env.NEXT_PUBLIC_APP_URL),
    env: process.env.NODE_ENV ?? "development",
    isProduction: process.env.NODE_ENV === "production",
    /** Vercel-provided at runtime — do not set manually */
    vercelUrl: optional(process.env.VERCEL_URL),
    vercelEnv: optional(process.env.VERCEL_ENV),
  },

  /** Supabase — database & authentication (required) */
  supabase: {
    url: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    /** Server-side only — do not expose to browser */
    serviceRole: required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY),
    /** Used by Supabase for OAuth redirect URLs */
    siteUrl: optional(process.env.NEXT_PUBLIC_SITE_URL),
  },

  /** Direct database access — migration tooling only, not for runtime use */
  db: {
    url: optional(process.env.DATABASE_URL),
    directUrl: optional(process.env.DIRECT_URL),
  },

  /** OpenAI — AI content generation (required) */
  openai: {
    /** Server-side only — do not expose to browser */
    apiKey: required("OPENAI_API_KEY", process.env.OPENAI_API_KEY),
    model: process.env.OPENAI_MODEL ?? "gpt-4o",
  },

  /** Auth / session (optional) */
  auth: {
    jwtSecret: optional(process.env.JWT_SECRET),
  },

  /** Qdrant vector database (future — optional until vector features are active) */
  qdrant: {
    url: optional(process.env.QDRANT_URL),
    apiKey: optional(process.env.QDRANT_API_KEY),
    collection: process.env.QDRANT_COLLECTION ?? "ai_publisher_default",
  },

  /** Wasabi object storage S3-compatible (future — optional until storage features are active) */
  wasabi: {
    accessKey: optional(process.env.WASABI_ACCESS_KEY_ID),
    secretKey: optional(process.env.WASABI_SECRET_ACCESS_KEY),
    bucket: optional(process.env.WASABI_BUCKET),
    region: process.env.WASABI_REGION ?? "us-east-1",
  },

  /** Billing via Stripe (future) */
  billing: {
    stripePublishableKey: optional(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    stripeSecretKey: optional(process.env.STRIPE_SECRET_KEY),
    stripeWebhookSecret: optional(process.env.STRIPE_WEBHOOK_SECRET),
  },

  /** Transactional email via Resend (future) */
  email: {
    resendApiKey: optional(process.env.RESEND_API_KEY),
    from: process.env.EMAIL_FROM ?? "noreply@example.com",
  },

  /** ZeroFlow platform services (future) */
  zeroflow: {
    apiUrl: optional(process.env.ZEROFLOW_API_URL),
    apiKey: optional(process.env.ZEROFLOW_API_KEY),
  },

  /** Feature flags */
  features: {
    analytics: process.env.ENABLE_ANALYTICS === "true",
    billing: process.env.ENABLE_BILLING === "true",
  },
};

/**
 * Validates all required environment variables at startup.
 *
 * Uses REQUIRED_VARS — the single source of truth for which variables are
 * required. Each entry in that list must also have a corresponding required()
 * call in the env object above so that per-property access also fails clearly.
 *
 * Call this in next.config.ts so that missing variables are caught at build
 * time or dev-server startup, before a broken deployment reaches production.
 *
 * Returns early without throwing if called in a browser context (where
 * server-only vars are always absent by design).
 */
export function validateEnv(): void {
  if (typeof window !== "undefined") return;

  const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n  ${missing.join("\n  ")}\n\n` +
        `Copy .env.example to .env.local and provide values for the above.\n` +
        `See docs/environment-variables.md for the full reference.`
    );
  }
}

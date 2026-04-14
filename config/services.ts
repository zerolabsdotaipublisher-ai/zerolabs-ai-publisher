/**
 * Grouped service configuration.
 *
 * Provides typed interfaces for every external service integration, composed
 * from the raw environment values in config/env.ts. Server-side only — only
 * import in server-side code (API routes, Server Components, server actions).
 *
 * Services are grouped to mirror the architecture guide:
 *   - App-layer services: Supabase (auth + DB), OpenAI (AI)
 *   - Infrastructure services: Qdrant (vector DB), Wasabi (object storage)
 *   - Platform services: ZeroFlow (shared platform layer)
 *   - Future services: Stripe (billing), Resend (email)
 *
 * Import from "@/config" for the unified entry point.
 */

import { env } from "./env";

// ---------------------------------------------------------------------------
// Interface definitions
// ---------------------------------------------------------------------------

export interface SupabaseConfig {
  /** Project URL — NEXT_PUBLIC, safe for browser */
  url: string;
  /** Anon (public) key — NEXT_PUBLIC, safe for browser */
  anonKey: string;
  /** Service role key — server-side only, bypasses Row-Level Security */
  serviceRole: string;
  /** Site URL used for OAuth redirect allow-list */
  siteUrl: string | undefined;
}

/** Direct database connection strings — migration tooling only, not for runtime use. */
export interface DatabaseConfig {
  /** Pooled connection string for ORM runtime */
  url: string | undefined;
  /** Direct connection string for ORM CLI migrations */
  directUrl: string | undefined;
}

export interface OpenAIConfig {
  /** API key — server-side only */
  apiKey: string;
  /** Model identifier used for content generation */
  model: string;
}

export interface QdrantConfig {
  /** Qdrant instance URL */
  url: string | undefined;
  /** API key for authenticated instances */
  apiKey: string | undefined;
  /** Collection name */
  collection: string;
}

export interface WasabiConfig {
  /** Wasabi access key ID */
  accessKey: string | undefined;
  /** Wasabi secret access key — server-side only */
  secretKey: string | undefined;
  /** Target bucket name */
  bucket: string | undefined;
  /** Bucket region */
  region: string;
  /** S3-compatible endpoint URL (e.g. https://s3.wasabisys.com) */
  endpoint: string | undefined;
}

export interface BillingConfig {
  /** Stripe publishable key — NEXT_PUBLIC, safe for browser */
  stripePublishableKey: string | undefined;
  /** Stripe secret key — server-side only */
  stripeSecretKey: string | undefined;
  /** Stripe webhook signing secret — server-side only */
  stripeWebhookSecret: string | undefined;
}

export interface EmailConfig {
  /** Resend API key — server-side only */
  resendApiKey: string | undefined;
  /** From address for outbound email */
  from: string;
}

export interface ZeroFlowConfig {
  /** Base URL of the ZeroFlow platform API */
  apiUrl: string | undefined;
  /** API key issued by the ZeroFlow platform — server-side only */
  apiKey: string | undefined;
}

export interface PipelineConfig {
  /** Deployment adapter target. Validated by lib/pipeline before use. */
  deploymentTarget: string;
  /** Optional base URL used for preview deployment URL assignment. */
  previewBaseUrl: string | undefined;
  /** Optional base URL used for production deployment URL assignment. */
  productionBaseUrl: string | undefined;
  /** Maximum adapter attempts for retryable deployment failures. */
  maxAttempts: number;
  /** Base retry delay in milliseconds. */
  retryBaseDelayMs: number;
}

export interface AuthConfig {
  /** JWT secret for signing application-level session tokens */
  jwtSecret: string | undefined;
}

/** All external service configurations grouped by provider. */
export interface ServiceConfig {
  supabase: SupabaseConfig;
  db: DatabaseConfig;
  openai: OpenAIConfig;
  qdrant: QdrantConfig;
  wasabi: WasabiConfig;
  billing: BillingConfig;
  email: EmailConfig;
  zeroflow: ZeroFlowConfig;
  pipeline: PipelineConfig;
  auth: AuthConfig;
}

// ---------------------------------------------------------------------------
// Exported configuration value
// ---------------------------------------------------------------------------

export const servicesConfig: ServiceConfig = {
  supabase: {
    url: env.supabase.url,
    anonKey: env.supabase.anonKey,
    serviceRole: env.supabase.serviceRole,
    siteUrl: env.supabase.siteUrl,
  },

  db: {
    url: env.db.url,
    directUrl: env.db.directUrl,
  },

  openai: {
    apiKey: env.openai.apiKey,
    model: env.openai.model,
  },

  qdrant: {
    url: env.qdrant.url,
    apiKey: env.qdrant.apiKey,
    collection: env.qdrant.collection,
  },

  wasabi: {
    accessKey: env.wasabi.accessKey,
    secretKey: env.wasabi.secretKey,
    bucket: env.wasabi.bucket,
    region: env.wasabi.region,
    endpoint: env.wasabi.endpoint,
  },

  billing: {
    stripePublishableKey: env.billing.stripePublishableKey,
    stripeSecretKey: env.billing.stripeSecretKey,
    stripeWebhookSecret: env.billing.stripeWebhookSecret,
  },

  email: {
    resendApiKey: env.email.resendApiKey,
    from: env.email.from,
  },

  zeroflow: {
    apiUrl: env.zeroflow.apiUrl,
    apiKey: env.zeroflow.apiKey,
  },

  pipeline: {
    deploymentTarget: env.pipeline.deploymentTarget,
    previewBaseUrl: env.pipeline.previewBaseUrl,
    productionBaseUrl: env.pipeline.productionBaseUrl,
    maxAttempts: env.pipeline.maxAttempts,
    retryBaseDelayMs: env.pipeline.retryBaseDelayMs,
  },

  auth: {
    jwtSecret: env.auth.jwtSecret,
  },
};

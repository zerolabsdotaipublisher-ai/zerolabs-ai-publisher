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

export interface SchedulerConfig {
  /** Optional bearer token used by external cron/system calls. */
  executionToken: string | undefined;
  /** Maximum schedules claimed in a single scheduler batch. */
  batchSize: number;
}

export interface MetaConfig {
  /** Meta App ID used for OAuth with Facebook/Instagram Graph APIs. */
  appId: string | undefined;
  /** Meta App Secret used for OAuth code exchange. */
  appSecret: string | undefined;
  /** OAuth callback URI configured in Meta developer settings. */
  redirectUri: string | undefined;
  /** Instagram Graph API version (e.g. v23.0). */
  instagramGraphApiVersion: string;
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
  /** Vercel provider configuration for hosting integration. */
  vercel: {
    /** Vercel API base URL. */
    apiUrl: string;
    /** Optional Vercel API token for direct API integrations. */
    token: string | undefined;
    /** Optional Vercel project ID. */
    projectId: string | undefined;
    /** Optional Vercel team ID (scope). */
    teamId: string | undefined;
    /** Deploy hook URL for preview environment deployments. */
    deployHookPreviewUrl: string | undefined;
    /** Deploy hook URL for production environment deployments. */
    deployHookProductionUrl: string | undefined;
    /** Base domain used to generate deterministic per-site subdomains. */
    defaultDomain: string | undefined;
    /** Enables real provider calls when true; otherwise adapter remains safe dry-run. */
    enableRealDeployments: boolean;
    /** Timeout in milliseconds for provider API calls. */
    timeoutMs: number;
  };
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
  scheduler: SchedulerConfig;
  meta: MetaConfig;
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

  scheduler: {
    executionToken: env.scheduler.executionToken,
    batchSize: env.scheduler.batchSize,
  },

  meta: {
    appId: env.meta.appId,
    appSecret: env.meta.appSecret,
    redirectUri: env.meta.redirectUri,
    instagramGraphApiVersion: env.meta.instagramGraphApiVersion,
  },

  pipeline: {
    deploymentTarget: env.pipeline.deploymentTarget,
    previewBaseUrl: env.pipeline.previewBaseUrl,
    productionBaseUrl: env.pipeline.productionBaseUrl,
    maxAttempts: env.pipeline.maxAttempts,
    retryBaseDelayMs: env.pipeline.retryBaseDelayMs,
    vercel: {
      apiUrl: env.pipeline.vercel.apiUrl,
      token: env.pipeline.vercel.token,
      projectId: env.pipeline.vercel.projectId,
      teamId: env.pipeline.vercel.teamId,
      deployHookPreviewUrl: env.pipeline.vercel.deployHookPreviewUrl,
      deployHookProductionUrl: env.pipeline.vercel.deployHookProductionUrl,
      defaultDomain: env.pipeline.vercel.defaultDomain,
      enableRealDeployments: env.pipeline.vercel.enableRealDeployments,
      timeoutMs: env.pipeline.vercel.timeoutMs,
    },
  },

  auth: {
    jwtSecret: env.auth.jwtSecret,
  },
};

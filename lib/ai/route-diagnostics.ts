import { NextResponse } from "next/server";
import {
  GENERATION_GENERIC_FAILURE_MESSAGE,
  resolveGenerationSafeMessage,
  type GenerationFailedStage,
  type GenerationSafeErrorCategory,
} from "@/lib/generation/diagnostics";
import { logger, normalizeError } from "@/lib/observability";

export type RouteDiagnosticCode =
  | "UNAUTHORIZED"
  | "INVALID_JSON"
  | "INVALID_INPUT"
  | "STRUCTURE_ID_REQUIRED"
  | "STRUCTURE_NOT_FOUND"
  | "OPENAI_RATE_LIMITED"
  | "OPENAI_AUTH_INVALID"
  | "OPENAI_REQUEST_REJECTED"
  | "OPENAI_UPSTREAM_ERROR"
  | "SUPABASE_SCHEMA_MISSING"
  | "SUPABASE_STORAGE_ERROR"
  | "GENERATION_INTERNAL_ERROR";

type DiagnosticService = "api" | "openai" | "supabase" | "versions";
type GenerationFailureSource = "route_guard" | "exception";

interface ErrorLike {
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  message?: unknown;
  name?: unknown;
}

interface ClassifiedGenerationRouteError {
  status: number;
  diagnosticCode: RouteDiagnosticCode;
  service: DiagnosticService;
  failedStage: GenerationFailedStage;
  safeErrorCategory: GenerationSafeErrorCategory;
  backendCode?: string;
  backendDetails?: string;
  backendHint?: string;
  upstreamStatus?: number;
}

interface DiagnosticResponseArgs {
  requestId: string;
  status: number;
  diagnosticCode: RouteDiagnosticCode;
  failedStage: GenerationFailedStage;
  safeErrorCategory: GenerationSafeErrorCategory;
  body?: Record<string, unknown>;
}

interface GenerationRouteErrorArgs {
  err: unknown;
  route: string;
  requestId: string;
  structureId?: string;
  userId?: string;
  websiteType?: string;
}

interface LoggedGenerationFailureResponseArgs extends DiagnosticResponseArgs {
  route: string;
  service?: DiagnosticService;
  category?: "security" | "error";
  source: GenerationFailureSource;
  structureId?: string;
  userId?: string;
  websiteType?: string;
  details?: string[];
}

function logGenerationFailure(args: {
  route: string;
  requestId: string;
  status: number;
  diagnosticCode: RouteDiagnosticCode;
  service: DiagnosticService;
  category: "security" | "error";
  failedStage: GenerationFailedStage;
  source: GenerationFailureSource;
  structureId?: string;
  userId?: string;
  websiteType?: string;
  details?: string[];
  safeErrorCategory: GenerationSafeErrorCategory;
  error?: ReturnType<typeof normalizeError>;
  upstreamStatus?: number;
  backendCode?: string;
  backendDetails?: string;
  backendHint?: string;
}): void {
  const log = args.status >= 500 ? logger.error : logger.warn;

  log("generation request failed", {
    category: args.category,
    service: args.service,
    route: args.route,
    requestId: args.requestId,
    status: args.status,
    failedStage: args.failedStage,
    source: args.source,
    diagnosticCode: args.diagnosticCode,
    safeErrorCategory: args.safeErrorCategory,
    structureId: args.structureId,
    userId: args.userId,
    websiteType: args.websiteType,
    validationErrorCount: args.details?.length,
    validationErrors: args.details,
    upstreamStatus: args.upstreamStatus,
    backendCode: args.backendCode,
    backendDetails: args.backendDetails,
    backendHint: args.backendHint,
    error: args.error,
  });
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asErrorLike(err: unknown): ErrorLike | null {
  if (!err || typeof err !== "object") {
    return null;
  }

  return err as ErrorLike;
}

function parseOpenAiStatus(message: string): number | undefined {
  const match = message.match(/OpenAI API error (\d+)/i);
  if (!match) {
    return undefined;
  }

  const status = Number(match[1]);
  return Number.isFinite(status) ? status : undefined;
}

function isSupabaseCode(code: string | undefined): boolean {
  if (!code) {
    return false;
  }

  return code.startsWith("PGRST") || /^[0-9A-Z]{5}$/.test(code);
}

function isOpenAiConfigError(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("generation configuration") ||
    normalized.includes("openai configuration") ||
    normalized.includes("openai api key") ||
    normalized.includes("openai model") ||
    normalized.includes("missing or invalid")
  );
}

function isOpenAiResponseParseError(message: string): boolean {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("openai returned empty") ||
    normalized.includes("empty seo content")
  );
}

function isSupabaseServiceRoleError(err: ErrorLike | null, message: string): boolean {
  return (
    readString(err?.name) === "SupabaseServiceRoleError" ||
    message.toLowerCase().includes("supabase service-role configuration")
  );
}

function isSchemaMissing(args: {
  backendCode?: string;
  backendDetails?: string;
  backendHint?: string;
  message: string;
}): boolean {
  const searchable = [
    args.message,
    args.backendDetails,
    args.backendHint,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return (
    args.backendCode === "PGRST205" ||
    args.backendCode === "42P01" ||
    searchable.includes("schema cache") ||
    searchable.includes("could not find the table") ||
    (searchable.includes("relation") && searchable.includes("does not exist"))
  );
}

function classifyGenerationRouteError(err: unknown): ClassifiedGenerationRouteError {
  const rawMessage = err instanceof Error ? err.message : readString(err) ?? "Unknown error";
  const errorLike = asErrorLike(err);
  const backendCode = readString(errorLike?.code);
  const backendDetails = readString(errorLike?.details);
  const backendHint = readString(errorLike?.hint);
  const openAiStatus = parseOpenAiStatus(rawMessage);

  if (isOpenAiConfigError(rawMessage)) {
    return {
      status: 503,
      diagnosticCode: "OPENAI_AUTH_INVALID",
      service: "openai",
      failedStage: "openai-config",
      safeErrorCategory: "ai-not-configured",
      backendCode,
      backendDetails,
      backendHint,
    };
  }

  if (openAiStatus === 429) {
    return {
      status: 429,
      diagnosticCode: "OPENAI_RATE_LIMITED",
      service: "openai",
      failedStage: "openai-request",
      safeErrorCategory: "ai-rate-limited",
      upstreamStatus: openAiStatus,
    };
  }

  if (openAiStatus === 401 || openAiStatus === 403) {
    return {
      status: 503,
      diagnosticCode: "OPENAI_AUTH_INVALID",
      service: "openai",
      failedStage: "openai-config",
      safeErrorCategory: "ai-not-configured",
      upstreamStatus: openAiStatus,
    };
  }

  if (openAiStatus === 400 || openAiStatus === 404) {
    return {
      status: 502,
      diagnosticCode: "OPENAI_REQUEST_REJECTED",
      service: "openai",
      failedStage: "openai-request",
      safeErrorCategory: "ai-request-failed",
      upstreamStatus: openAiStatus,
    };
  }

  if (typeof openAiStatus === "number") {
    return {
      status: 502,
      diagnosticCode: "OPENAI_UPSTREAM_ERROR",
      service: "openai",
      failedStage: "openai-request",
      safeErrorCategory: "ai-request-failed",
      upstreamStatus: openAiStatus,
    };
  }

  if (isOpenAiResponseParseError(rawMessage)) {
    return {
      status: 502,
      diagnosticCode: "OPENAI_UPSTREAM_ERROR",
      service: "openai",
      failedStage: "openai-response-parse",
      safeErrorCategory: "ai-response-invalid",
      backendCode,
      backendDetails,
      backendHint,
    };
  }

  if (isSupabaseServiceRoleError(errorLike, rawMessage)) {
    return {
      status: 503,
      diagnosticCode: "SUPABASE_STORAGE_ERROR",
      service: "supabase",
      failedStage: "database-save",
      safeErrorCategory: "database-save-failed",
      backendCode,
      backendDetails,
      backendHint,
    };
  }

  if (
    isSchemaMissing({
      backendCode,
      backendDetails,
      backendHint,
      message: rawMessage,
    })
  ) {
    return {
      status: 503,
      diagnosticCode: "SUPABASE_SCHEMA_MISSING",
      service: "supabase",
      failedStage: "database-save",
      safeErrorCategory: "database-save-failed",
      backendCode,
      backendDetails,
      backendHint,
    };
  }

  if (isSupabaseCode(backendCode)) {
    return {
      status: 500,
      diagnosticCode: "SUPABASE_STORAGE_ERROR",
      service: "supabase",
      failedStage: "database-save",
      safeErrorCategory: "database-save-failed",
      backendCode,
      backendDetails,
      backendHint,
    };
  }

  return {
    status: 500,
    diagnosticCode: "GENERATION_INTERNAL_ERROR",
    service: "api",
    failedStage: "openai-request",
    safeErrorCategory: "internal",
    backendCode,
    backendDetails,
    backendHint,
  };
}

export function createDiagnosticResponse(args: DiagnosticResponseArgs): NextResponse {
  const safeMessage = resolveGenerationSafeMessage({
    diagnosticCode: args.diagnosticCode,
    failedStage: args.failedStage,
    safeErrorCategory: args.safeErrorCategory,
    fallback:
      readString(args.body?.["message"]) ??
      readString(args.body?.["error"]) ??
      GENERATION_GENERIC_FAILURE_MESSAGE,
  });

  return NextResponse.json(
    {
      ...(args.body ?? {}),
      error: safeMessage,
      message: safeMessage,
      diagnosticCode: args.diagnosticCode,
      requestId: args.requestId,
      failedStage: args.failedStage,
      safeErrorCategory: args.safeErrorCategory,
    },
    {
      status: args.status,
      headers: {
        "x-request-id": args.requestId,
      },
    },
  );
}

export function createLoggedGenerationFailureResponse(
  args: LoggedGenerationFailureResponseArgs,
): NextResponse {
  logGenerationFailure({
    route: args.route,
    requestId: args.requestId,
    status: args.status,
    diagnosticCode: args.diagnosticCode,
    service: args.service ?? "api",
    category: args.category ?? (args.status === 401 ? "security" : "error"),
    failedStage: args.failedStage,
    source: args.source,
    structureId: args.structureId,
    userId: args.userId,
    websiteType: args.websiteType,
    details: args.details,
    safeErrorCategory: args.safeErrorCategory,
  });

  return createDiagnosticResponse(args);
}

export function createGenerationRouteErrorResponse(
  args: GenerationRouteErrorArgs,
): NextResponse {
  const classified = classifyGenerationRouteError(args.err);
  logGenerationFailure({
    route: args.route,
    requestId: args.requestId,
    status: classified.status,
    diagnosticCode: classified.diagnosticCode,
    service: classified.service,
    category: "error",
    failedStage: classified.failedStage,
    source: "exception",
    structureId: args.structureId,
    userId: args.userId,
    websiteType: args.websiteType,
    safeErrorCategory: classified.safeErrorCategory,
    upstreamStatus: classified.upstreamStatus,
    backendCode: classified.backendCode,
    backendDetails: classified.backendDetails,
    backendHint: classified.backendHint,
    error: normalizeError(args.err),
  });

  return createDiagnosticResponse({
    requestId: args.requestId,
    status: classified.status,
    diagnosticCode: classified.diagnosticCode,
    failedStage: classified.failedStage,
    safeErrorCategory: classified.safeErrorCategory,
  });
}

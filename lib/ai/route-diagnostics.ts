import { NextResponse } from "next/server";
import { logger, normalizeError } from "@/lib/observability";

const RATE_LIMIT_MESSAGE =
  "Generation is temporarily rate-limited. Please wait a moment, then try again.";
const OPENAI_AUTH_MESSAGE =
  "Generation is temporarily unavailable because the AI provider could not authenticate this request. Please try again later.";
const OPENAI_REQUEST_MESSAGE =
  "Generation request was rejected by the AI provider. Please review your inputs and try again.";
const STORAGE_NOT_READY_MESSAGE =
  "Website generation is temporarily unavailable because storage is not ready. Please try again later.";
const STORAGE_FAILURE_MESSAGE =
  "Website generation could not save progress right now. Please try again in a moment.";
const GENERIC_FAILURE_MESSAGE =
  "Generation could not be completed right now. Please review your inputs or try again in a moment.";

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

type DiagnosticService = "api" | "openai" | "supabase";
type GenerationFailureStage = "auth" | "input" | "lookup" | "generation";
type GenerationFailureSource = "route_guard" | "exception";
type ProviderErrorCategory =
  | "request_validation"
  | "not_found"
  | "rate_limit"
  | "auth"
  | "request_rejected"
  | "upstream"
  | "schema_missing"
  | "storage"
  | "internal";

interface ErrorLike {
  code?: unknown;
  details?: unknown;
  hint?: unknown;
  message?: unknown;
}

interface ClassifiedGenerationRouteError {
  status: number;
  message: string;
  diagnosticCode: RouteDiagnosticCode;
  service: DiagnosticService;
  providerErrorCategory: ProviderErrorCategory;
  backendCode?: string;
  backendDetails?: string;
  backendHint?: string;
  upstreamStatus?: number;
}

interface DiagnosticResponseArgs {
  requestId: string;
  status: number;
  diagnosticCode: RouteDiagnosticCode;
  body: Record<string, unknown>;
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
  stage: GenerationFailureStage;
  source: GenerationFailureSource;
  structureId?: string;
  userId?: string;
  websiteType?: string;
  details?: string[];
  providerErrorCategory?: ProviderErrorCategory;
}

function logGenerationFailure(args: {
  route: string;
  requestId: string;
  status: number;
  diagnosticCode: RouteDiagnosticCode;
  service: DiagnosticService;
  category: "security" | "error";
  stage: GenerationFailureStage;
  source: GenerationFailureSource;
  structureId?: string;
  userId?: string;
  websiteType?: string;
  details?: string[];
  providerErrorCategory: ProviderErrorCategory;
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
    stage: args.stage,
    source: args.source,
    diagnosticCode: args.diagnosticCode,
    providerErrorCategory: args.providerErrorCategory,
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
  return typeof value === "string" && value.trim() ? value : undefined;
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

  if (openAiStatus === 429) {
    return {
      status: 429,
      message: RATE_LIMIT_MESSAGE,
      diagnosticCode: "OPENAI_RATE_LIMITED",
      service: "openai",
      providerErrorCategory: "rate_limit",
      upstreamStatus: openAiStatus,
    };
  }

  if (openAiStatus === 401 || openAiStatus === 403) {
    return {
      status: 502,
      message: OPENAI_AUTH_MESSAGE,
      diagnosticCode: "OPENAI_AUTH_INVALID",
      service: "openai",
      providerErrorCategory: "auth",
      upstreamStatus: openAiStatus,
    };
  }

  if (openAiStatus === 400 || openAiStatus === 404) {
    return {
      status: 502,
      message: OPENAI_REQUEST_MESSAGE,
      diagnosticCode: "OPENAI_REQUEST_REJECTED",
      service: "openai",
      providerErrorCategory: "request_rejected",
      upstreamStatus: openAiStatus,
    };
  }

  if (typeof openAiStatus === "number" || /OpenAI returned empty/i.test(rawMessage)) {
    return {
      status: 502,
      message: GENERIC_FAILURE_MESSAGE,
      diagnosticCode: "OPENAI_UPSTREAM_ERROR",
      service: "openai",
      providerErrorCategory: "upstream",
      upstreamStatus: openAiStatus,
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
      message: STORAGE_NOT_READY_MESSAGE,
      diagnosticCode: "SUPABASE_SCHEMA_MISSING",
      service: "supabase",
      providerErrorCategory: "schema_missing",
      backendCode,
      backendDetails,
      backendHint,
    };
  }

  if (isSupabaseCode(backendCode)) {
    return {
      status: 500,
      message: STORAGE_FAILURE_MESSAGE,
      diagnosticCode: "SUPABASE_STORAGE_ERROR",
      service: "supabase",
      providerErrorCategory: "storage",
      backendCode,
      backendDetails,
      backendHint,
    };
  }

  return {
    status: 500,
    message: GENERIC_FAILURE_MESSAGE,
    diagnosticCode: "GENERATION_INTERNAL_ERROR",
    service: "api",
    providerErrorCategory: "internal",
    backendCode,
    backendDetails,
    backendHint,
  };
}

export function createDiagnosticResponse(args: DiagnosticResponseArgs): NextResponse {
  return NextResponse.json(
    {
      ...args.body,
      diagnosticCode: args.diagnosticCode,
      requestId: args.requestId,
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
    stage: args.stage,
    source: args.source,
    structureId: args.structureId,
    userId: args.userId,
    websiteType: args.websiteType,
    details: args.details,
    providerErrorCategory:
      args.providerErrorCategory ??
      (args.diagnosticCode === "INVALID_INPUT" || args.diagnosticCode === "INVALID_JSON"
        ? "request_validation"
        : args.diagnosticCode === "STRUCTURE_NOT_FOUND"
          ? "not_found"
          : args.diagnosticCode === "UNAUTHORIZED"
            ? "auth"
            : "internal"),
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
    stage: "generation",
    source: "exception",
    structureId: args.structureId,
    userId: args.userId,
    websiteType: args.websiteType,
    providerErrorCategory: classified.providerErrorCategory,
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
    body: {
      error: classified.message,
      message: classified.message,
    },
  });
}

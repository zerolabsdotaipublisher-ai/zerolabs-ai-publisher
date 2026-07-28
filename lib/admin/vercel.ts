import "server-only";

import packageJson from "../../package.json";
import {
  VERCEL_ANALYTICS_COMPONENT_LOCATION,
  VERCEL_ANALYTICS_COMPONENT_RENDERED,
  VERCEL_ANALYTICS_RUNTIME_MODE,
} from "@/components/analytics/vercel-analytics";
import { config } from "@/config";
import { logger } from "@/lib/observability";

const REQUEST_TIMEOUT_MS = 10_000;
const RECENT_DEPLOYMENTS_LIMIT = 6;
const RECENT_DEPLOYMENT_EVENT_LIMIT = 24;
const ANALYTICS_BREAKDOWN_LIMIT = 5;

type AnalyticsWindowKey = "last7Days" | "last30Days";
type AnalyticsBreakdownKey = "topPages" | "referrers" | "countries" | "devices" | "browsers";
type AnalyticsGroupParamKey = "groupBy" | "by";
type AnalyticsRangeVariantId = "from-to-iso" | "since-until-iso" | "from-to-ms" | "since-until-ms";
type AnalyticsDimensionKey = "day" | "route" | "referrer" | "country" | "device" | "browser";

export type VercelCheckStatus = "configured" | "missing" | "available" | "unavailable" | "optional";
export type VercelConnectionState = "connected" | "missing" | "error";
export type VercelDiagnosticCode =
  | "missing-token"
  | "missing-project-id"
  | "missing-team-id"
  | "analytics-package-missing"
  | "analytics-component-missing"
  | "unauthorized"
  | "forbidden"
  | "rate-limited"
  | "logs-unavailable"
  | "analytics-unavailable"
  | "analytics-disabled"
  | "no-data-yet"
  | "unsupported-query-shape"
  | "unsupported-endpoint"
  | "provider-error"
  | "no-deployments";
export type VercelDiagnosticTone = "info" | "warning" | "error";

export interface VercelIntegrationCheck {
  id: string;
  label: string;
  status: VercelCheckStatus;
  detail: string;
}

export interface VercelIntegrationDiagnostic {
  code: VercelDiagnosticCode;
  tone: VercelDiagnosticTone;
  label: string;
  detail: string;
}

export interface VercelDeploymentSummary {
  id: string;
  name: string;
  url: string | null;
  inspectUrl: string | null;
  state: string;
  createdAt: string | null;
  readyAt: string | null;
  branch: string | null;
  commitSha: string | null;
  target: string | null;
  creator: string | null;
  buildDurationMs: number | null;
}

export interface VercelProjectSummary {
  id: string;
  name: string;
  framework: string | null;
  nodeVersion: string | null;
  productionBranch: string | null;
  analyticsEnabled: boolean;
  speedInsightsEnabled: boolean;
}

export interface VercelLogEntrySummary {
  id: string;
  level: "error" | "warning" | "info" | "unknown";
  message: string;
  source: string | null;
  createdAt: string | null;
}

export interface VercelLogsSummary {
  available: boolean;
  statusLabel: string;
  message: string;
  entries: VercelLogEntrySummary[];
  dashboardHref: string | null;
  diagnosticCodes: VercelDiagnosticCode[];
}

export interface VercelAnalyticsSeriesPoint {
  id: string;
  date: string | null;
  label: string;
  visits: number | null;
  pageViews: number | null;
  visitors: number | null;
}

export interface VercelAnalyticsWindowSummary {
  key: AnalyticsWindowKey;
  label: string;
  from: string;
  to: string;
  visits: number | null;
  pageViews: number | null;
  visitors: number | null;
  daily: VercelAnalyticsSeriesPoint[];
}

export interface VercelAnalyticsBreakdownRow {
  id: string;
  label: string;
  value: number;
  visitors: number | null;
  share: number | null;
}

export interface VercelAnalyticsBreakdownSummary {
  label: string;
  available: boolean;
  message: string;
  rows: VercelAnalyticsBreakdownRow[];
}

export interface VercelAnalyticsInstrumentationSummary {
  packageInstalled: boolean;
  packageVersion: string | null;
  componentRendered: boolean;
  componentLocation: string;
  runtimeMode: "development" | "production";
}

export interface VercelAnalyticsSummary {
  available: boolean;
  configured: boolean;
  statusLabel: string;
  message: string;
  dashboardHref: string | null;
  diagnosticCodes: VercelDiagnosticCode[];
  instrumentation: VercelAnalyticsInstrumentationSummary;
  actionItems: string[];
  checks: VercelIntegrationCheck[];
  last7Days: VercelAnalyticsWindowSummary;
  last30Days: VercelAnalyticsWindowSummary;
  topPages: VercelAnalyticsBreakdownSummary;
  referrers: VercelAnalyticsBreakdownSummary;
  countries: VercelAnalyticsBreakdownSummary;
  devices: VercelAnalyticsBreakdownSummary;
  browsers: VercelAnalyticsBreakdownSummary;
  fetchedAt: string | null;
}

export interface VercelIntegrationOverview {
  status: {
    isConfigured: boolean;
    connectionState: VercelConnectionState;
    apiTokenConfigured: boolean;
    projectConfigured: boolean;
    teamConfigured: boolean;
    missingEnvironmentVariables: string[];
    message: string;
  };
  project: VercelProjectSummary | null;
  latestDeployment: VercelDeploymentSummary | null;
  deploymentDetailsHref: string | null;
  deployments: VercelDeploymentSummary[];
  logs: VercelLogsSummary;
  analytics: VercelAnalyticsSummary;
  checks: VercelIntegrationCheck[];
  diagnostics: VercelIntegrationDiagnostic[];
  fetchedAt: string | null;
}

type VercelApiContext = {
  apiUrl: string;
  token: string | undefined;
  projectId: string | undefined;
  teamId: string | undefined;
};

type VercelProjectResponse = {
  id?: unknown;
  name?: unknown;
  framework?: unknown;
  nodeVersion?: unknown;
  productionBranch?: unknown;
  analytics?: unknown;
  webAnalytics?: unknown;
  analyticsId?: unknown;
  speedInsights?: unknown;
  features?: unknown;
};

type VercelDeploymentResponse = {
  id?: unknown;
  uid?: unknown;
  name?: unknown;
  url?: unknown;
  inspectorUrl?: unknown;
  state?: unknown;
  created?: unknown;
  createdAt?: unknown;
  ready?: unknown;
  buildingAt?: unknown;
  target?: unknown;
  creator?: unknown;
  meta?: unknown;
};

type VercelDeploymentsListResponse = {
  deployments?: unknown;
};

type VercelApiErrorDetails = {
  message: string;
  code: string | null;
};

type AnalyticsTimeRange = {
  key: AnalyticsWindowKey;
  label: string;
  from: string;
  to: string;
};

type AnalyticsRangeVariant = {
  id: AnalyticsRangeVariantId;
  params: Record<string, string | number | undefined>;
};

type AnalyticsDimensionSpec = {
  key: AnalyticsDimensionKey;
  label: string;
  apiValues: string[];
  responseKeys: string[];
};

type AnalyticsMetricSet = {
  visits: number | null;
  pageViews: number | null;
  visitors: number | null;
  primary: number | null;
};

type AnalyticsCountOutcome =
  | { status: "success"; metrics: AnalyticsMetricSet; rangeVariantId: AnalyticsRangeVariantId }
  | { status: "empty" }
  | { status: "failure"; code: VercelDiagnosticCode; message: string };

type AnalyticsSeriesOutcome =
  | {
      status: "success";
      points: VercelAnalyticsSeriesPoint[];
      rangeVariantId: AnalyticsRangeVariantId;
      groupParamKey: AnalyticsGroupParamKey;
    }
  | { status: "empty" }
  | { status: "failure"; code: VercelDiagnosticCode; message: string };

type AnalyticsBreakdownOutcome =
  | {
      status: "success";
      rows: VercelAnalyticsBreakdownRow[];
      rangeVariantId: AnalyticsRangeVariantId;
      groupParamKey: AnalyticsGroupParamKey;
    }
  | { status: "empty" }
  | { status: "failure"; code: VercelDiagnosticCode; message: string };

class VercelApiError extends Error {
  readonly statusCode: number;
  readonly code: string | null;

  constructor(message: string, statusCode: number, code: string | null) {
    super(message);
    this.name = "VercelApiError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

const ANALYTICS_BREAKDOWN_SPECS: Record<AnalyticsBreakdownKey, AnalyticsDimensionSpec> = {
  topPages: {
    key: "route",
    label: "Top pages",
    apiValues: ["requestPath", "route"],
    responseKeys: ["requestPath", "route", "path", "pathname", "request_path"],
  },
  referrers: {
    key: "referrer",
    label: "Referrers",
    apiValues: ["referrerHostname", "referrer"],
    responseKeys: ["referrerHostname", "referrer", "referrer_hostname", "source"],
  },
  countries: {
    key: "country",
    label: "Countries",
    apiValues: ["country"],
    responseKeys: ["country", "countryCode", "countryName", "country_code"],
  },
  devices: {
    key: "device",
    label: "Devices",
    apiValues: ["deviceType", "device"],
    responseKeys: ["deviceType", "device", "device_type"],
  },
  browsers: {
    key: "browser",
    label: "Browsers",
    apiValues: ["browserName", "browser"],
    responseKeys: ["browserName", "browser", "browser_name"],
  },
};

const ANALYTICS_DAY_SPEC: AnalyticsDimensionSpec = {
  key: "day",
  label: "Daily trend",
  apiValues: ["day"],
  responseKeys: ["day", "date", "bucket", "time", "timestamp"],
};

function getAnalyticsPackageVersion(): string | null {
  const dependencies = packageJson.dependencies as Record<string, string> | undefined;
  const devDependencies = packageJson.devDependencies as Record<string, string> | undefined;

  return dependencies?.["@vercel/analytics"] ?? devDependencies?.["@vercel/analytics"] ?? null;
}

function createAnalyticsInstrumentationSummary(): VercelAnalyticsInstrumentationSummary {
  const packageVersion = getAnalyticsPackageVersion();

  return {
    packageInstalled: Boolean(packageVersion),
    packageVersion,
    componentRendered: VERCEL_ANALYTICS_COMPONENT_RENDERED,
    componentLocation: VERCEL_ANALYTICS_COMPONENT_LOCATION,
    runtimeMode: VERCEL_ANALYTICS_RUNTIME_MODE,
  };
}

function parseSortableTime(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function readArray(value: unknown): unknown[] | null {
  return Array.isArray(value) ? value : null;
}

function toIsoString(value: unknown): string | null {
  const numericValue = readNumber(value);

  if (numericValue !== null) {
    return new Date(numericValue).toISOString();
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }

  return null;
}

function normalizeAbsoluteUrl(value: unknown): string | null {
  const url = readString(value);

  if (!url) {
    return null;
  }

  if (url.startsWith("/")) {
    return null;
  }

  const candidate = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

function normalizeVercelDashboardUrl(value: unknown): string | null {
  const href = normalizeAbsoluteUrl(value);

  if (!href) {
    return null;
  }

  try {
    const parsedUrl = new URL(href);
    return parsedUrl.hostname.endsWith("vercel.com") ? parsedUrl.toString() : null;
  } catch {
    return null;
  }
}

function extractErrorDetails(error: unknown): VercelApiErrorDetails {
  if (error instanceof VercelApiError) {
    return {
      message: error.message,
      code: error.code,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: null,
    };
  }

  const record = readRecord(error);
  const nestedError = readRecord(record?.error);
  const nestedMessage = readString(nestedError?.message);
  const nestedCode = readString(nestedError?.code);
  const directMessage = readString(record?.message);
  const directCode = readString(record?.code);

  return {
    message: nestedMessage ?? directMessage ?? "Unknown Vercel integration error.",
    code: nestedCode ?? directCode,
  };
}

function resolveVercelContext(): VercelApiContext {
  return {
    apiUrl: config.services.pipeline.vercel.apiUrl,
    token: config.services.pipeline.vercel.token,
    projectId: config.services.pipeline.vercel.projectId,
    teamId: config.services.pipeline.vercel.teamId,
  };
}

function resolveMissingEnvironmentVariables(context: VercelApiContext): string[] {
  const missingVariables: string[] = [];

  if (!context.token) {
    missingVariables.push("VERCEL_API_TOKEN");
  }

  if (!context.projectId) {
    missingVariables.push("VERCEL_PROJECT_ID");
  }

  return missingVariables;
}

async function fetchVercelJson<T>(
  context: VercelApiContext,
  path: string,
  searchParams?: Record<string, string | number | undefined>,
): Promise<T> {
  const url = new URL(path, context.apiUrl.endsWith("/") ? context.apiUrl : `${context.apiUrl}/`);

  if (context.teamId) {
    url.searchParams.set("teamId", context.teamId);
  }

  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (value === undefined) {
      continue;
    }

    url.searchParams.set(key, String(value));
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${context.token}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    const payload = (await response.json().catch(() => ({}))) as T;

    if (!response.ok) {
      const errorDetails = extractErrorDetails(payload);
      throw new VercelApiError(errorDetails.message, response.status, errorDetails.code);
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

function hasAnalyticsFeature(value: unknown): boolean {
  if (value === true) {
    return true;
  }

  const record = readRecord(value);
  return Boolean(record && Object.keys(record).length > 0);
}

function hasProjectFeature(
  project: VercelProjectResponse,
  featureKeys: string[],
  nestedFeatureKeys: string[] = featureKeys,
): boolean {
  const features = readRecord(project.features);

  for (const key of featureKeys) {
    if (hasAnalyticsFeature(project[key as keyof VercelProjectResponse])) {
      return true;
    }
  }

  for (const key of nestedFeatureKeys) {
    if (hasAnalyticsFeature(features?.[key])) {
      return true;
    }
  }

  return false;
}

function readDeploymentMetaValue(meta: Record<string, unknown> | null, keys: string[]): string | null {
  if (!meta) {
    return null;
  }

  for (const key of keys) {
    const value = readString(meta[key]);
    if (value) {
      return value;
    }
  }

  return null;
}

function computeBuildDurationMs(input: VercelDeploymentResponse): number | null {
  const ready = readNumber(input.ready);
  const buildingAt = readNumber(input.buildingAt);
  const createdAt = readNumber(input.createdAt) ?? readNumber(input.created);
  const start = buildingAt ?? createdAt;

  if (ready === null || start === null || ready < start) {
    return null;
  }

  return ready - start;
}

function mapDeploymentSummary(input: VercelDeploymentResponse): VercelDeploymentSummary {
  const meta = readRecord(input.meta);
  const creator = readRecord(input.creator);

  return {
    id: readString(input.uid) ?? readString(input.id) ?? "unknown-deployment",
    name: readString(input.name) ?? "Vercel deployment",
    url: normalizeAbsoluteUrl(input.url),
    inspectUrl: normalizeVercelDashboardUrl(input.inspectorUrl),
    state: readString(input.state) ?? "UNKNOWN",
    createdAt: toIsoString(input.createdAt ?? input.created),
    readyAt: toIsoString(input.ready),
    branch: readDeploymentMetaValue(meta, [
      "githubCommitRef",
      "gitlabCommitRef",
      "bitbucketCommitRef",
      "branch",
    ]),
    commitSha: readDeploymentMetaValue(meta, [
      "githubCommitSha",
      "gitlabCommitSha",
      "bitbucketCommitSha",
      "commitSha",
    ]),
    target: readString(input.target) ?? readDeploymentMetaValue(meta, ["target"]),
    creator: readString(creator?.username) ?? readString(creator?.email) ?? readString(creator?.name),
    buildDurationMs: computeBuildDurationMs(input),
  };
}

function normalizeLogEntriesResponse(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  const record = readRecord(value);
  return readArray(record?.events) ?? readArray(record?.logs) ?? [];
}

function inferLogLevel(values: Array<string | null>): VercelLogEntrySummary["level"] {
  const joined = values
    .filter((value): value is string => Boolean(value))
    .join(" ")
    .toLowerCase();

  if (joined.includes("error") || joined.includes("fail")) {
    return "error";
  }

  if (joined.includes("warn")) {
    return "warning";
  }

  if (joined.length > 0) {
    return "info";
  }

  return "unknown";
}

function mapLogEntry(value: unknown, index: number): VercelLogEntrySummary | null {
  const record = readRecord(value);
  const payload = readRecord(record?.payload);
  const message =
    readString(record?.text) ??
    readString(record?.message) ??
    readString(payload?.text) ??
    readString(payload?.message) ??
    readString(record?.name) ??
    readString(payload?.name);

  if (!message) {
    return null;
  }

  return {
    id: readString(record?.id) ?? `deployment-event-${index}`,
    level: inferLogLevel([
      readString(record?.level),
      readString(record?.type),
      readString(record?.name),
      readString(payload?.level),
      readString(payload?.type),
      readString(payload?.name),
      message,
    ]),
    message,
    source: readString(record?.source) ?? readString(record?.type) ?? readString(payload?.source) ?? readString(payload?.type),
    createdAt: toIsoString(record?.created ?? record?.date ?? record?.time ?? payload?.time ?? payload?.date),
  };
}

function prioritizeLogEntries(entries: VercelLogEntrySummary[]): VercelLogEntrySummary[] {
  const sortedEntries = [...entries].sort(
    (left, right) => parseSortableTime(right.createdAt) - parseSortableTime(left.createdAt),
  );
  const highlighted = sortedEntries.filter((entry) => entry.level === "error" || entry.level === "warning");

  return (highlighted.length > 0 ? highlighted : sortedEntries).slice(0, 6);
}

function createDiagnostic(params: {
  code: VercelDiagnosticCode;
  tone: VercelDiagnosticTone;
  label: string;
  detail: string;
}): VercelIntegrationDiagnostic {
  return params;
}

function pushUniqueDiagnostic(
  diagnostics: VercelIntegrationDiagnostic[],
  diagnostic: VercelIntegrationDiagnostic,
): void {
  if (diagnostics.some((entry) => entry.code === diagnostic.code)) {
    return;
  }

  diagnostics.push(diagnostic);
}

function buildBaseDiagnostics(params: {
  apiTokenConfigured: boolean;
  projectConfigured: boolean;
  teamConfigured: boolean;
}): VercelIntegrationDiagnostic[] {
  const diagnostics: VercelIntegrationDiagnostic[] = [];

  if (!params.apiTokenConfigured) {
    pushUniqueDiagnostic(
      diagnostics,
      createDiagnostic({
        code: "missing-token",
        tone: "error",
        label: "Missing Vercel token",
        detail: "Set VERCEL_API_TOKEN or PIPELINE_VERCEL_TOKEN so the admin dashboard can query Vercel server-side.",
      }),
    );
  }

  if (!params.projectConfigured) {
    pushUniqueDiagnostic(
      diagnostics,
      createDiagnostic({
        code: "missing-project-id",
        tone: "error",
        label: "Missing Vercel project ID",
        detail: "Set VERCEL_PROJECT_ID or PIPELINE_VERCEL_PROJECT_ID so deployment and analytics reads target the correct Vercel project.",
      }),
    );
  }

  if (!params.teamConfigured) {
    pushUniqueDiagnostic(
      diagnostics,
      createDiagnostic({
        code: "missing-team-id",
        tone: "warning",
        label: "Team scope not configured",
        detail: "Team-owned Vercel projects can require VERCEL_TEAM_ID. Without it, project, deployment, or analytics reads may remain incomplete.",
      }),
    );
  }

  return diagnostics;
}

function buildLogsUnavailableSummary(params: {
  message: string;
  dashboardHref: string | null;
  diagnosticCodes: VercelDiagnosticCode[];
}): VercelLogsSummary {
  return {
    available: false,
    statusLabel: "Logs unavailable from API",
    message: params.message,
    entries: [],
    dashboardHref: params.dashboardHref,
    diagnosticCodes: params.diagnosticCodes,
  };
}

function createAnalyticsTimeRange(key: AnalyticsWindowKey, label: string, days: number): AnalyticsTimeRange {
  const to = new Date();
  const from = new Date(to.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    key,
    label,
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

function createAnalyticsRangeVariants(range: AnalyticsTimeRange): AnalyticsRangeVariant[] {
  const fromMs = Date.parse(range.from);
  const toMs = Date.parse(range.to);

  return [
    { id: "from-to-iso", params: { from: range.from, to: range.to } },
    { id: "since-until-iso", params: { since: range.from, until: range.to } },
    { id: "from-to-ms", params: { from: fromMs, to: toMs } },
    { id: "since-until-ms", params: { since: fromMs, until: toMs } },
  ];
}

function createEmptyAnalyticsWindow(range: AnalyticsTimeRange): VercelAnalyticsWindowSummary {
  return {
    key: range.key,
    label: range.label,
    from: range.from,
    to: range.to,
    visits: null,
    pageViews: null,
    visitors: null,
    daily: [],
  };
}

function createEmptyAnalyticsBreakdown(label: string, message: string): VercelAnalyticsBreakdownSummary {
  return {
    label,
    available: false,
    message,
    rows: [],
  };
}

function buildAnalyticsUnavailableSummary(params: {
  configured: boolean;
  statusLabel: string;
  message: string;
  dashboardHref: string | null;
  diagnosticCodes: VercelDiagnosticCode[];
  instrumentation?: VercelAnalyticsInstrumentationSummary;
  actionItems?: string[];
  checks?: VercelIntegrationCheck[];
}): VercelAnalyticsSummary {
  const last7Days = createAnalyticsTimeRange("last7Days", "Last 7 days", 7);
  const last30Days = createAnalyticsTimeRange("last30Days", "Last 30 days", 30);
  const instrumentation = params.instrumentation ?? createAnalyticsInstrumentationSummary();

  return {
    available: false,
    configured: params.configured,
    statusLabel: params.statusLabel,
    message: params.message,
    dashboardHref: params.dashboardHref,
    diagnosticCodes: params.diagnosticCodes,
    instrumentation,
    actionItems: params.actionItems ?? [],
    checks: params.checks ?? createAnalyticsBaseChecks(instrumentation, null),
    last7Days: createEmptyAnalyticsWindow(last7Days),
    last30Days: createEmptyAnalyticsWindow(last30Days),
    topPages: createEmptyAnalyticsBreakdown("Top pages", params.message),
    referrers: createEmptyAnalyticsBreakdown("Referrers", params.message),
    countries: createEmptyAnalyticsBreakdown("Countries", params.message),
    devices: createEmptyAnalyticsBreakdown("Devices", params.message),
    browsers: createEmptyAnalyticsBreakdown("Browsers", params.message),
    fetchedAt: null,
  };
}

function readMetricFromSources(
  sources: Array<Record<string, unknown> | null>,
  keys: string[],
): number | null {
  for (const source of sources) {
    if (!source) {
      continue;
    }

    for (const key of keys) {
      const value = readNumber(source[key]);
      if (value !== null) {
        return value;
      }
    }
  }

  return null;
}

function extractAnalyticsMetrics(value: unknown): AnalyticsMetricSet {
  const directNumber = readNumber(value);

  if (directNumber !== null) {
    return {
      visits: directNumber,
      pageViews: directNumber,
      visitors: null,
      primary: directNumber,
    };
  }

  const record = readRecord(value);
  if (!record) {
    return {
      visits: null,
      pageViews: null,
      visitors: null,
      primary: null,
    };
  }

  const sources = [
    record,
    readRecord(record.metrics),
    readRecord(record.values),
    readRecord(record.totals),
    readRecord(record.data),
  ];

  const visits = readMetricFromSources(sources, ["visits", "visitCount", "views", "pageViews", "pageviews", "count", "value", "total"]);
  const pageViews = readMetricFromSources(sources, ["pageViews", "pageviews", "views", "visits", "count", "value", "total"]) ?? visits;
  const visitors = readMetricFromSources(sources, ["visitors", "uniqueVisitors", "unique_visitors", "unique"]);
  const primary = pageViews ?? visits ?? visitors;

  return {
    visits: visits ?? pageViews,
    pageViews,
    visitors,
    primary,
  };
}

function normalizeAnalyticsRowsResponse(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  const record = readRecord(value);
  return readArray(record?.data) ?? readArray(record?.rows) ?? readArray(record?.results) ?? readArray(record?.buckets) ?? [];
}

function parseAnalyticsCountResponse(value: unknown): AnalyticsMetricSet | null {
  const metrics = extractAnalyticsMetrics(value);
  if (metrics.primary !== null || metrics.visitors !== null) {
    return metrics;
  }

  const rows = normalizeAnalyticsRowsResponse(value);
  if (rows.length === 1) {
    const rowMetrics = extractAnalyticsMetrics(rows[0]);
    if (rowMetrics.primary !== null || rowMetrics.visitors !== null) {
      return rowMetrics;
    }
  }

  return null;
}

function isAnalyticsResponseEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  const record = readRecord(value);
  if (!record) {
    return false;
  }

  const rows = normalizeAnalyticsRowsResponse(record);
  return Object.keys(record).length === 0 || rows.length === 0;
}

function mapAnalyticsError(error: unknown, fallback: string): { code: VercelDiagnosticCode; message: string } {
  if (error instanceof VercelApiError) {
    if (error.statusCode === 401) {
      return {
        code: "unauthorized",
        message: "The configured token cannot read Vercel Web Analytics for this project.",
      };
    }

    if (error.statusCode === 403 || error.code === "forbidden") {
      return {
        code: "forbidden",
        message: "The configured token does not have permission to read Vercel Web Analytics for this project.",
      };
    }

    if (error.statusCode === 429 || error.code === "rate_limited") {
      return {
        code: "rate-limited",
        message: "The Vercel Web Analytics request was rate-limited.",
      };
    }

    if (error.statusCode === 404 || error.statusCode === 405 || error.code === "not_found") {
      return {
        code: "unsupported-endpoint",
        message: "The Vercel Web Analytics query endpoint is unavailable for this project or token scope.",
      };
    }

    if (error.statusCode === 400 || error.statusCode === 422) {
      return {
        code: "unsupported-query-shape",
        message: "Vercel Web Analytics rejected the current server-side query shape for this request.",
      };
    }
  }

  return {
    code: "provider-error",
    message: fallback,
  };
}

function shouldRetryAnalyticsVariant(error: unknown): boolean {
  if (!(error instanceof VercelApiError)) {
    return false;
  }

  return error.statusCode === 400 || error.statusCode === 422;
}

function prioritizeRangeVariants(
  variants: AnalyticsRangeVariant[],
  preferredId?: AnalyticsRangeVariantId,
): AnalyticsRangeVariant[] {
  if (!preferredId) {
    return variants;
  }

  return [
    ...variants.filter((variant) => variant.id === preferredId),
    ...variants.filter((variant) => variant.id !== preferredId),
  ];
}

function prioritizeGroupParamKeys(preferredKey?: AnalyticsGroupParamKey): AnalyticsGroupParamKey[] {
  const keys: AnalyticsGroupParamKey[] = ["by", "groupBy"];
  if (!preferredKey) {
    return keys;
  }

  return [preferredKey, ...keys.filter((key) => key !== preferredKey)];
}

function formatAnalyticsMetricCount(value: number | null): string {
  if (value === null) {
    return "Not returned";
  }

  return new Intl.NumberFormat("en-US").format(value);
}

function formatAnalyticsMetricSummary(metrics: AnalyticsMetricSet): string {
  const segments: string[] = [];

  if (metrics.pageViews !== null) {
    segments.push(`${formatAnalyticsMetricCount(metrics.pageViews)} page views`);
  } else if (metrics.visits !== null) {
    segments.push(`${formatAnalyticsMetricCount(metrics.visits)} visits`);
  }

  if (metrics.visitors !== null) {
    segments.push(`${formatAnalyticsMetricCount(metrics.visitors)} visitors`);
  }

  return segments.length > 0 ? segments.join(" / ") : "No metrics were returned.";
}

function createAnalyticsPackageCheck(instrumentation: VercelAnalyticsInstrumentationSummary): VercelIntegrationCheck {
  return {
    id: "analytics-package",
    label: "Analytics package",
    status: instrumentation.packageInstalled ? "configured" : "missing",
    detail: instrumentation.packageInstalled
      ? `@vercel/analytics ${instrumentation.packageVersion ?? ""}`.trim() + " is installed in this build."
      : "Install @vercel/analytics so Vercel can inject the Web Analytics client beacon.",
  };
}

function createAnalyticsComponentCheck(instrumentation: VercelAnalyticsInstrumentationSummary): VercelIntegrationCheck {
  return {
    id: "analytics-component",
    label: "Analytics component",
    status: instrumentation.componentRendered ? "configured" : "missing",
    detail: instrumentation.componentRendered
      ? `<Analytics /> is rendered from ${instrumentation.componentLocation} and forced to production mode on preview and production deploys.`
      : `Render <Analytics /> from @vercel/analytics/next in ${instrumentation.componentLocation}.`,
  };
}

function createAnalyticsProjectMetadataCheck(project: VercelProjectSummary | null): VercelIntegrationCheck {
  if (!project) {
    return {
      id: "analytics-project-metadata",
      label: "Project metadata",
      status: "unavailable",
      detail: "Project metadata could not be loaded, so the Web Analytics and Speed Insights flags are unknown.",
    };
  }

  if (project.analyticsEnabled) {
    return {
      id: "analytics-project-metadata",
      label: "Project metadata",
      status: "configured",
      detail: `Project metadata reports Web Analytics enabled.${project.speedInsightsEnabled ? " Speed Insights is also enabled." : " Speed Insights is not currently reported enabled."}`,
    };
  }

  return {
    id: "analytics-project-metadata",
    label: "Project metadata",
    status: "optional",
    detail: "Project metadata does not currently report Web Analytics enabled, so Vercel may still need the feature enabled or redeployed.",
  };
}

function createAnalyticsCountCheck(range: AnalyticsTimeRange, outcome: AnalyticsCountOutcome): VercelIntegrationCheck {
  if (outcome.status === "success") {
    return {
      id: `analytics-count-${range.key}`,
      label: `Visits count query (${range.label.toLowerCase()})`,
      status: "available",
      detail: `The visits/count query reached Vercel and returned ${formatAnalyticsMetricSummary(outcome.metrics)}.`,
    };
  }

  if (outcome.status === "empty") {
    return {
      id: `analytics-count-${range.key}`,
      label: `Visits count query (${range.label.toLowerCase()})`,
      status: "configured",
      detail: "The visits/count query reached Vercel but did not return any totals for this window.",
    };
  }

  return {
    id: `analytics-count-${range.key}`,
    label: `Visits count query (${range.label.toLowerCase()})`,
    status: "unavailable",
    detail: outcome.message,
  };
}

function createAnalyticsSeriesCheck(
  range: AnalyticsTimeRange,
  outcome: AnalyticsSeriesOutcome,
  skippedBecauseNoTraffic: boolean,
): VercelIntegrationCheck {
  if (skippedBecauseNoTraffic) {
    return {
      id: `analytics-series-${range.key}`,
      label: `Daily aggregate query (${range.label.toLowerCase()})`,
      status: "optional",
      detail: "Skipped the daily grouped query until the 7-day count query reports traffic.",
    };
  }

  if (outcome.status === "success") {
    return {
      id: `analytics-series-${range.key}`,
      label: `Daily aggregate query (${range.label.toLowerCase()})`,
      status: "available",
      detail: `The visits/aggregate query returned ${formatAnalyticsMetricCount(outcome.points.length)} grouped day buckets.`,
    };
  }

  if (outcome.status === "empty") {
    return {
      id: `analytics-series-${range.key}`,
      label: `Daily aggregate query (${range.label.toLowerCase()})`,
      status: "configured",
      detail: "The visits/aggregate query reached Vercel but did not return daily buckets for this window.",
    };
  }

  return {
    id: `analytics-series-${range.key}`,
    label: `Daily aggregate query (${range.label.toLowerCase()})`,
    status: "unavailable",
    detail: outcome.message,
  };
}

function createAnalyticsBreakdownCheck(
  outcomes: Record<AnalyticsBreakdownKey, AnalyticsBreakdownOutcome>,
  skippedBecauseNoTraffic: boolean,
): VercelIntegrationCheck {
  if (skippedBecauseNoTraffic) {
    return {
      id: "analytics-breakdowns-last30Days",
      label: "Grouped breakdown queries (last 30 days)",
      status: "optional",
      detail: "Skipped grouped page, referrer, country, device, and browser queries until the 30-day count query reports traffic.",
    };
  }

  const successes = Object.entries(outcomes)
    .filter((entry): entry is [AnalyticsBreakdownKey, Extract<AnalyticsBreakdownOutcome, { status: "success" }>] => entry[1].status === "success")
    .map(([key]) => ANALYTICS_BREAKDOWN_SPECS[key].label);
  const failures = Object.values(outcomes).filter(
    (outcome): outcome is Extract<AnalyticsBreakdownOutcome, { status: "failure" }> => outcome.status === "failure",
  );

  if (failures.length > 0) {
    return {
      id: "analytics-breakdowns-last30Days",
      label: "Grouped breakdown queries (last 30 days)",
      status: "unavailable",
      detail: failures[0].message,
    };
  }

  if (successes.length > 0) {
    return {
      id: "analytics-breakdowns-last30Days",
      label: "Grouped breakdown queries (last 30 days)",
      status: "available",
      detail: `The visits/aggregate query returned grouped rows for ${successes.join(", ")}.`,
    };
  }

  return {
    id: "analytics-breakdowns-last30Days",
    label: "Grouped breakdown queries (last 30 days)",
    status: "configured",
    detail: "The grouped 30-day queries reached Vercel but did not return breakdown rows yet.",
  };
}

function createAnalyticsBaseChecks(
  instrumentation: VercelAnalyticsInstrumentationSummary,
  project: VercelProjectSummary | null,
): VercelIntegrationCheck[] {
  return [
    createAnalyticsPackageCheck(instrumentation),
    createAnalyticsComponentCheck(instrumentation),
    createAnalyticsProjectMetadataCheck(project),
  ];
}

async function fetchAnalyticsCountForRange(
  context: VercelApiContext,
  range: AnalyticsTimeRange,
): Promise<AnalyticsCountOutcome> {
  let lastProviderError: unknown = null;

  for (const variant of createAnalyticsRangeVariants(range)) {
    try {
      const response = await fetchVercelJson<unknown>(context, "/v1/query/web-analytics/visits/count", {
        projectId: context.projectId,
        ...variant.params,
      });
      const metrics = parseAnalyticsCountResponse(response);

      if (metrics) {
        return {
          status: "success",
          metrics,
          rangeVariantId: variant.id,
        };
      }

      if (isAnalyticsResponseEmpty(response)) {
        return { status: "empty" };
      }

      logger.warn("Vercel analytics count response could not be normalized", {
        category: "error",
        service: "vercel",
        keys: Object.keys(readRecord(response) ?? {}),
      });
      return {
        status: "failure",
        code: "provider-error",
        message: "Vercel Web Analytics returned a count response that could not be normalized safely.",
      };
    } catch (error) {
      if (shouldRetryAnalyticsVariant(error)) {
        lastProviderError = error;
        continue;
      }

      const mapped = mapAnalyticsError(
        error,
        "Vercel Web Analytics count data could not be loaded safely for this admin view.",
      );
      return {
        status: "failure",
        code: mapped.code,
        message: mapped.message,
      };
    }
  }

  if (lastProviderError) {
    const mapped = mapAnalyticsError(
      lastProviderError,
      "Vercel Web Analytics count data could not be loaded safely for this admin view.",
    );
    return {
      status: "failure",
      code: mapped.code,
      message: mapped.message,
    };
  }

  return {
    status: "failure",
    code: "provider-error",
    message: "Vercel Web Analytics count data could not be loaded safely for this admin view.",
  };
}

function readAnalyticsDimensionValue(record: Record<string, unknown>, keys: string[]): string | null {
  const sources = [record, readRecord(record.dimensions), readRecord(record.dimension), readRecord(record.group)];

  for (const source of sources) {
    if (!source) {
      continue;
    }

    for (const key of keys) {
      const value = readString(source[key]);
      if (value) {
        return value;
      }
    }
  }

  for (const source of sources) {
    if (!source) {
      continue;
    }

    for (const [key, rawValue] of Object.entries(source)) {
      if (key === "id" || key === "slug" || key === "label") {
        continue;
      }

      const value = readString(rawValue);
      if (value) {
        return value;
      }
    }
  }

  return null;
}

function formatAnalyticsDimensionLabel(spec: AnalyticsDimensionSpec, rawValue: string | null): string | null {
  if (!rawValue) {
    return null;
  }

  if (spec.key === "route") {
    return rawValue;
  }

  if (spec.key === "referrer") {
    const normalized = rawValue.toLowerCase();
    if (normalized === "direct" || normalized === "(direct)" || normalized === "none") {
      return "Direct / unknown";
    }

    return rawValue;
  }

  if (spec.key === "country" && /^[a-z]{2}$/i.test(rawValue)) {
    return rawValue.toUpperCase();
  }

  return formatVercelState(rawValue);
}

function createAnalyticsBreakdownRow(
  spec: AnalyticsDimensionSpec,
  value: unknown,
  index: number,
  total: number | null,
): VercelAnalyticsBreakdownRow | null {
  const record = readRecord(value);
  if (!record) {
    return null;
  }

  const metrics = extractAnalyticsMetrics(record);
  const rowValue = metrics.primary;
  if (rowValue === null) {
    return null;
  }

  const rawLabel = readAnalyticsDimensionValue(record, spec.responseKeys) ?? readString(record.label) ?? readString(record.name);
  const label = formatAnalyticsDimensionLabel(spec, rawLabel);

  if (!label) {
    return null;
  }

  return {
    id: `${spec.key}-${index}-${label}`,
    label,
    value: rowValue,
    visitors: metrics.visitors,
    share: total && total > 0 ? rowValue / total : null,
  };
}

function formatAnalyticsDateLabel(value: string | null): string {
  if (!value) {
    return "Unknown day";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function createAnalyticsSeriesPoint(value: unknown, index: number): VercelAnalyticsSeriesPoint | null {
  const record = readRecord(value);
  if (!record) {
    return null;
  }

  const metrics = extractAnalyticsMetrics(record);
  if (metrics.primary === null && metrics.visitors === null) {
    return null;
  }

  const rawDate =
    readAnalyticsDimensionValue(record, ANALYTICS_DAY_SPEC.responseKeys) ??
    readString(record.label) ??
    readString(record.name);
  const date = toIsoString(rawDate) ?? rawDate;

  return {
    id: `day-${index}-${date ?? index}`,
    date,
    label: formatAnalyticsDateLabel(date ?? rawDate),
    visits: metrics.visits,
    pageViews: metrics.pageViews,
    visitors: metrics.visitors,
  };
}

async function fetchAnalyticsSeriesForRange(
  context: VercelApiContext,
  range: AnalyticsTimeRange,
  preferredRangeVariantId?: AnalyticsRangeVariantId,
  preferredGroupParamKey?: AnalyticsGroupParamKey,
): Promise<AnalyticsSeriesOutcome> {
  let lastProviderError: unknown = null;
  const rangeVariants = prioritizeRangeVariants(createAnalyticsRangeVariants(range), preferredRangeVariantId);
  const groupParamKeys = prioritizeGroupParamKeys(preferredGroupParamKey);

  for (const variant of rangeVariants) {
    for (const groupParamKey of groupParamKeys) {
      for (const apiValue of ANALYTICS_DAY_SPEC.apiValues) {
        try {
          const response = await fetchVercelJson<unknown>(context, "/v1/query/web-analytics/visits/aggregate", {
            projectId: context.projectId,
            limit: 7,
            ...variant.params,
            [groupParamKey]: apiValue,
          });
          const points = normalizeAnalyticsRowsResponse(response)
            .map((entry, index) => createAnalyticsSeriesPoint(entry, index))
            .filter((entry): entry is VercelAnalyticsSeriesPoint => Boolean(entry))
            .sort((left, right) => parseSortableTime(left.date) - parseSortableTime(right.date));

          if (points.length > 0) {
            return {
              status: "success",
              points,
              rangeVariantId: variant.id,
              groupParamKey,
            };
          }

          if (isAnalyticsResponseEmpty(response)) {
            return { status: "empty" };
          }
        } catch (error) {
          if (shouldRetryAnalyticsVariant(error)) {
            lastProviderError = error;
            continue;
          }

          const mapped = mapAnalyticsError(
            error,
            "Vercel Web Analytics daily trend data could not be loaded safely for this admin view.",
          );
          return {
            status: "failure",
            code: mapped.code,
            message: mapped.message,
          };
        }
      }
    }
  }

  if (lastProviderError) {
    const mapped = mapAnalyticsError(
      lastProviderError,
      "Vercel Web Analytics daily trend data could not be loaded safely for this admin view.",
    );
    return {
      status: "failure",
      code: mapped.code,
      message: mapped.message,
    };
  }

  return {
    status: "failure",
    code: "provider-error",
    message: "Vercel Web Analytics daily trend data could not be loaded safely for this admin view.",
  };
}

async function fetchAnalyticsBreakdownForRange(
  context: VercelApiContext,
  range: AnalyticsTimeRange,
  spec: AnalyticsDimensionSpec,
  total: number | null,
  preferredRangeVariantId?: AnalyticsRangeVariantId,
  preferredGroupParamKey?: AnalyticsGroupParamKey,
): Promise<AnalyticsBreakdownOutcome> {
  let lastProviderError: unknown = null;
  const rangeVariants = prioritizeRangeVariants(createAnalyticsRangeVariants(range), preferredRangeVariantId);
  const groupParamKeys = prioritizeGroupParamKeys(preferredGroupParamKey);

  for (const variant of rangeVariants) {
    for (const groupParamKey of groupParamKeys) {
      for (const apiValue of spec.apiValues) {
        try {
          const response = await fetchVercelJson<unknown>(context, "/v1/query/web-analytics/visits/aggregate", {
            projectId: context.projectId,
            limit: ANALYTICS_BREAKDOWN_LIMIT,
            ...variant.params,
            [groupParamKey]: apiValue,
          });
          const rows = normalizeAnalyticsRowsResponse(response)
            .map((entry, index) => createAnalyticsBreakdownRow(spec, entry, index, total))
            .filter((entry): entry is VercelAnalyticsBreakdownRow => Boolean(entry))
            .sort((left, right) => right.value - left.value)
            .slice(0, ANALYTICS_BREAKDOWN_LIMIT);

          if (rows.length > 0) {
            return {
              status: "success",
              rows,
              rangeVariantId: variant.id,
              groupParamKey,
            };
          }

          if (isAnalyticsResponseEmpty(response)) {
            return { status: "empty" };
          }
        } catch (error) {
          if (shouldRetryAnalyticsVariant(error)) {
            lastProviderError = error;
            continue;
          }

          const mapped = mapAnalyticsError(
            error,
            `Vercel Web Analytics ${spec.label.toLowerCase()} data could not be loaded safely for this admin view.`,
          );
          return {
            status: "failure",
            code: mapped.code,
            message: mapped.message,
          };
        }
      }
    }
  }

  if (lastProviderError) {
    const mapped = mapAnalyticsError(
      lastProviderError,
      `Vercel Web Analytics ${spec.label.toLowerCase()} data could not be loaded safely for this admin view.`,
    );
    return {
      status: "failure",
      code: mapped.code,
      message: mapped.message,
    };
  }

  return {
    status: "failure",
    code: "provider-error",
    message: `Vercel Web Analytics ${spec.label.toLowerCase()} data could not be loaded safely for this admin view.`,
  };
}

function createBreakdownSummary(
  label: string,
  outcome: AnalyticsBreakdownOutcome,
  emptyMessage: string,
): VercelAnalyticsBreakdownSummary {
  if (outcome.status === "success") {
    return {
      label,
      available: true,
      message: `${label} loaded from Vercel Web Analytics.`,
      rows: outcome.rows,
    };
  }

  if (outcome.status === "empty") {
    return createEmptyAnalyticsBreakdown(label, emptyMessage);
  }

  return createEmptyAnalyticsBreakdown(label, outcome.message);
}

function hasWindowTraffic(window: VercelAnalyticsWindowSummary): boolean {
  return Boolean((window.pageViews ?? window.visits ?? 0) > 0 || (window.visitors ?? 0) > 0);
}

function buildWindowFromOutcome(
  range: AnalyticsTimeRange,
  outcome: AnalyticsCountOutcome,
  series: AnalyticsSeriesOutcome,
): VercelAnalyticsWindowSummary {
  const window = createEmptyAnalyticsWindow(range);

  if (outcome.status === "success") {
    window.visits = outcome.metrics.visits;
    window.pageViews = outcome.metrics.pageViews;
    window.visitors = outcome.metrics.visitors;
  }

  if (series.status === "success") {
    window.daily = series.points;
  }

  return window;
}

async function getDeploymentLogsSummary(
  context: VercelApiContext,
  latestDeployment: VercelDeploymentSummary | null,
): Promise<VercelLogsSummary> {
  if (!latestDeployment) {
    return buildLogsUnavailableSummary({
      message: "Logs unavailable from API because no deployment records are currently available.",
      dashboardHref: null,
      diagnosticCodes: ["logs-unavailable", "no-deployments"],
    });
  }

  try {
    const response = await fetchVercelJson<unknown>(
      context,
      `/v3/deployments/${encodeURIComponent(latestDeployment.id)}/events`,
      {
        direction: "backward",
        limit: RECENT_DEPLOYMENT_EVENT_LIMIT,
      },
    );
    const entries = prioritizeLogEntries(
      normalizeLogEntriesResponse(response)
        .map((entry, index) => mapLogEntry(entry, index))
        .filter((entry): entry is VercelLogEntrySummary => Boolean(entry)),
    );

    return {
      available: true,
      statusLabel: entries.length > 0 ? "Build events available" : "No recent build events",
      message:
        entries.length > 0
          ? "Recent deployment build-event lines were loaded from Vercel."
          : "Vercel returned the deployment event endpoint, but there were no recent build-event lines to summarize.",
      entries,
      dashboardHref: latestDeployment.inspectUrl,
      diagnosticCodes: [],
    };
  } catch (error) {
    if (error instanceof VercelApiError) {
      if (error.statusCode === 401) {
        return buildLogsUnavailableSummary({
          message: "Logs unavailable from API because the configured token cannot read deployment events for this project.",
          dashboardHref: latestDeployment.inspectUrl,
          diagnosticCodes: ["unauthorized", "logs-unavailable"],
        });
      }

      if (error.statusCode === 403 || error.code === "forbidden") {
        return buildLogsUnavailableSummary({
          message: "Logs unavailable from API because the configured token does not have permission to read deployment events for this project.",
          dashboardHref: latestDeployment.inspectUrl,
          diagnosticCodes: ["forbidden", "logs-unavailable"],
        });
      }

      if (error.statusCode === 429 || error.code === "rate_limited") {
        return buildLogsUnavailableSummary({
          message: "Logs unavailable from API because the Vercel request was rate-limited.",
          dashboardHref: latestDeployment.inspectUrl,
          diagnosticCodes: ["rate-limited", "logs-unavailable"],
        });
      }
    }

    return buildLogsUnavailableSummary({
      message: "Logs unavailable from API. Open the deployment in Vercel to inspect build or runtime logs directly when the dashboard URL is available.",
      dashboardHref: latestDeployment.inspectUrl,
      diagnosticCodes: ["logs-unavailable"],
    });
  }
}

async function getVercelAnalyticsSummary(params: {
  context: VercelApiContext;
  project: VercelProjectSummary | null;
  dashboardHref: string | null;
}): Promise<VercelAnalyticsSummary> {
  const instrumentation = createAnalyticsInstrumentationSummary();
  const diagnosticCodes = new Set<VercelDiagnosticCode>();
  const actionItems = new Set<string>();

  if (!instrumentation.packageInstalled) {
    diagnosticCodes.add("analytics-package-missing");
    actionItems.add("Install @vercel/analytics in the Next.js app.");
  }

  if (!instrumentation.componentRendered) {
    diagnosticCodes.add("analytics-component-missing");
    actionItems.add(`Render <Analytics /> from @vercel/analytics/next in ${instrumentation.componentLocation}.`);
  }

  if (!instrumentation.packageInstalled || !instrumentation.componentRendered) {
    actionItems.add("Redeploy after shipping the Vercel Analytics client integration.");
  }

  if (!params.project) {
    return buildAnalyticsUnavailableSummary({
      configured: false,
      statusLabel: "Traffic analytics unavailable",
      message: "Traffic analytics availability could not be evaluated because the Vercel project metadata was not loaded safely.",
      dashboardHref: params.dashboardHref,
      diagnosticCodes: ["provider-error", ...diagnosticCodes],
      instrumentation,
      actionItems: [...actionItems],
      checks: createAnalyticsBaseChecks(instrumentation, null),
    });
  }

  const last7Range = createAnalyticsTimeRange("last7Days", "Last 7 days", 7);
  const last30Range = createAnalyticsTimeRange("last30Days", "Last 30 days", 30);
  const [last7Count, last30Count] = await Promise.all([
    fetchAnalyticsCountForRange(params.context, last7Range),
    fetchAnalyticsCountForRange(params.context, last30Range),
  ]);
  const countFailures = [last7Count, last30Count].filter(
    (outcome): outcome is Extract<AnalyticsCountOutcome, { status: "failure" }> => outcome.status === "failure",
  );

  for (const failure of countFailures) {
    diagnosticCodes.add(failure.code);
  }

  const preferredRangeVariantId =
    last30Count.status === "success"
      ? last30Count.rangeVariantId
      : last7Count.status === "success"
        ? last7Count.rangeVariantId
        : undefined;

  const shouldQuerySeries = last7Count.status === "success" && (last7Count.metrics.primary ?? last7Count.metrics.visitors ?? 0) > 0;
  const last7Series = shouldQuerySeries
    ? await fetchAnalyticsSeriesForRange(params.context, last7Range, preferredRangeVariantId)
    : ({ status: "empty" } as const);

  const preferredSeriesGroupParamKey = last7Series.status === "success" ? last7Series.groupParamKey : undefined;
  const preferredSeriesRangeVariantId =
    last7Series.status === "success" ? last7Series.rangeVariantId : preferredRangeVariantId;

  const shouldQueryBreakdowns = last30Count.status === "success" && (last30Count.metrics.primary ?? last30Count.metrics.visitors ?? 0) > 0;
  const breakdownOutcomes = shouldQueryBreakdowns
    ? await Promise.all([
        fetchAnalyticsBreakdownForRange(
          params.context,
          last30Range,
          ANALYTICS_BREAKDOWN_SPECS.topPages,
          last30Count.metrics.primary,
          preferredSeriesRangeVariantId,
          preferredSeriesGroupParamKey,
        ),
        fetchAnalyticsBreakdownForRange(
          params.context,
          last30Range,
          ANALYTICS_BREAKDOWN_SPECS.referrers,
          last30Count.metrics.primary,
          preferredSeriesRangeVariantId,
          preferredSeriesGroupParamKey,
        ),
        fetchAnalyticsBreakdownForRange(
          params.context,
          last30Range,
          ANALYTICS_BREAKDOWN_SPECS.countries,
          last30Count.metrics.primary,
          preferredSeriesRangeVariantId,
          preferredSeriesGroupParamKey,
        ),
        fetchAnalyticsBreakdownForRange(
          params.context,
          last30Range,
          ANALYTICS_BREAKDOWN_SPECS.devices,
          last30Count.metrics.primary,
          preferredSeriesRangeVariantId,
          preferredSeriesGroupParamKey,
        ),
        fetchAnalyticsBreakdownForRange(
          params.context,
          last30Range,
          ANALYTICS_BREAKDOWN_SPECS.browsers,
          last30Count.metrics.primary,
          preferredSeriesRangeVariantId,
          preferredSeriesGroupParamKey,
        ),
      ])
    : ([
        { status: "empty" },
        { status: "empty" },
        { status: "empty" },
        { status: "empty" },
        { status: "empty" },
      ] as const);

  if (last7Series.status === "failure" && countFailures.length === 0) {
    diagnosticCodes.add(last7Series.code);
  }

  const [topPagesOutcome, referrersOutcome, countriesOutcome, devicesOutcome, browsersOutcome] = breakdownOutcomes;
  const breakdownOutcomeMap = {
    topPages: topPagesOutcome,
    referrers: referrersOutcome,
    countries: countriesOutcome,
    devices: devicesOutcome,
    browsers: browsersOutcome,
  } satisfies Record<AnalyticsBreakdownKey, AnalyticsBreakdownOutcome>;
  const last7Days = buildWindowFromOutcome(last7Range, last7Count, last7Series);
  const last30Days = buildWindowFromOutcome(last30Range, last30Count, { status: "empty" });
  const topPages = createBreakdownSummary(
    ANALYTICS_BREAKDOWN_SPECS.topPages.label,
    topPagesOutcome,
    "No page-level Vercel Web Analytics data was returned for the selected time window.",
  );
  const referrers = createBreakdownSummary(
    ANALYTICS_BREAKDOWN_SPECS.referrers.label,
    referrersOutcome,
    "No referrer data was returned for the selected time window.",
  );
  const countries = createBreakdownSummary(
    ANALYTICS_BREAKDOWN_SPECS.countries.label,
    countriesOutcome,
    "No country data was returned for the selected time window.",
  );
  const devices = createBreakdownSummary(
    ANALYTICS_BREAKDOWN_SPECS.devices.label,
    devicesOutcome,
    "No device data was returned for the selected time window.",
  );
  const browsers = createBreakdownSummary(
    ANALYTICS_BREAKDOWN_SPECS.browsers.label,
    browsersOutcome,
    "No browser data was returned for the selected time window.",
  );
  const analyticsChecks = [
    ...createAnalyticsBaseChecks(instrumentation, params.project),
    createAnalyticsCountCheck(last7Range, last7Count),
    createAnalyticsCountCheck(last30Range, last30Count),
    createAnalyticsSeriesCheck(last7Range, last7Series, !shouldQuerySeries),
    createAnalyticsBreakdownCheck(breakdownOutcomeMap, !shouldQueryBreakdowns),
  ];

  for (const outcome of Object.values(breakdownOutcomeMap)) {
    if (outcome.status === "failure") {
      diagnosticCodes.add(outcome.code);
    }
  }

  const hasTrafficData =
    hasWindowTraffic(last7Days) ||
    hasWindowTraffic(last30Days) ||
    topPages.available ||
    referrers.available ||
    countries.available ||
    devices.available ||
    browsers.available;

  if (!hasTrafficData) {
    if (!params.project.analyticsEnabled) {
      diagnosticCodes.add("analytics-disabled");
      actionItems.add("Enable Web Analytics in the Vercel project settings.");
      actionItems.add("Redeploy after enabling Web Analytics so Vercel can attach the analytics intake routes.");
    }

    if (countFailures.length > 0) {
      const firstFailure = countFailures[0];
      if (firstFailure.code === "unauthorized") {
        actionItems.add("Grant the configured Vercel token permission to read Web Analytics for this project.");
      } else if (firstFailure.code === "forbidden") {
        actionItems.add("Verify the token belongs to the project owner or the configured team scope.");
      } else if (firstFailure.code === "rate-limited") {
        actionItems.add("Retry after the current Vercel API rate-limit window resets.");
      } else if (firstFailure.code === "unsupported-query-shape") {
        actionItems.add("Verify the project has Web Analytics enabled and that the token can use Vercel's public Web Analytics API.");
      } else if (firstFailure.code === "unsupported-endpoint") {
        actionItems.add("Verify the project can access the public Vercel Web Analytics API with the configured team scope.");
      }

      const statusLabel =
        firstFailure.code === "unauthorized"
          ? "Web Analytics unauthorized"
          : firstFailure.code === "forbidden"
            ? "Web Analytics forbidden"
            : firstFailure.code === "rate-limited"
              ? "Web Analytics rate-limited"
              : firstFailure.code === "unsupported-endpoint"
                ? "Web Analytics endpoint unavailable"
                : firstFailure.code === "unsupported-query-shape"
                  ? "Web Analytics query rejected"
                  : "Web Analytics unavailable";
      const message = !params.project.analyticsEnabled
        ? "Vercel did not return traffic data, and the project metadata does not currently report Web Analytics enabled. Enable Web Analytics in the Vercel project settings, redeploy, and retry after the deployment receives traffic."
        : firstFailure.message;

      return {
        ...buildAnalyticsUnavailableSummary({
          configured: params.project.analyticsEnabled,
          statusLabel,
          message,
          dashboardHref: params.dashboardHref,
          diagnosticCodes: [...diagnosticCodes],
          instrumentation,
          actionItems: [...actionItems],
          checks: analyticsChecks,
        }),
        last7Days,
        last30Days,
      };
    }

    diagnosticCodes.add("no-data-yet");
    actionItems.add("Visit the production domain to generate the first page views.");
    const message =
      !instrumentation.packageInstalled || !instrumentation.componentRendered
        ? "This build is not fully instrumented for Vercel Web Analytics yet. Install the package, render the Analytics component in the root layout, redeploy, and then generate traffic."
        : !params.project.analyticsEnabled
          ? "This build is instrumented for Vercel Web Analytics, but the Vercel project metadata does not currently report Web Analytics enabled. Enable Web Analytics in Vercel, redeploy, and then visit the production domain to generate the first page views."
          : "Vercel Web Analytics is instrumented and the API is reachable, but the selected 7-day and 30-day windows do not contain traffic data yet. Visit the production domain and allow Vercel time to ingest the first page views.";

    return {
      ...buildAnalyticsUnavailableSummary({
        configured: params.project.analyticsEnabled,
        statusLabel: "No Vercel Web Analytics data yet",
        message,
        dashboardHref: params.dashboardHref,
        diagnosticCodes: [...diagnosticCodes],
        instrumentation,
        actionItems: [...actionItems],
        checks: analyticsChecks,
      }),
      last7Days,
      last30Days,
      topPages,
      referrers,
      countries,
      devices,
      browsers,
    };
  }

  const breakdownFailures = Object.values(breakdownOutcomeMap).filter(
    (outcome): outcome is Extract<AnalyticsBreakdownOutcome, { status: "failure" }> => outcome.status === "failure",
  );

  return {
    available: true,
    configured: params.project.analyticsEnabled || hasTrafficData,
    statusLabel: "Vercel Web Analytics available",
    message:
      breakdownFailures.length > 0
        ? "Real Vercel Web Analytics totals were loaded server-side, but one or more grouped breakdown queries were rejected by Vercel."
        : topPages.available || referrers.available || countries.available || devices.available || browsers.available
          ? "Real Vercel Web Analytics metrics were loaded server-side for this project."
          : "Real Vercel Web Analytics totals were loaded server-side, but grouped breakdowns were not returned for this project.",
    dashboardHref: params.dashboardHref,
    diagnosticCodes: [...diagnosticCodes],
    instrumentation,
    actionItems: [...actionItems],
    checks: analyticsChecks,
    last7Days,
    last30Days,
    topPages,
    referrers,
    countries,
    devices,
    browsers,
    fetchedAt: new Date().toISOString(),
  };
}

function createChecks(params: {
  apiTokenConfigured: boolean;
  projectConfigured: boolean;
  teamConfigured: boolean;
  deploymentsStatus: VercelCheckStatus;
  deploymentsDetail: string;
  logsStatus: VercelCheckStatus;
  logsDetail: string;
  analyticsStatus: VercelCheckStatus;
  analyticsDetail: string;
  extraChecks?: VercelIntegrationCheck[];
}): VercelIntegrationCheck[] {
  return [
    {
      id: "token",
      label: "Vercel API token",
      status: params.apiTokenConfigured ? "configured" : "missing",
      detail: params.apiTokenConfigured
        ? "A server-side Vercel API token is configured."
        : "Add VERCEL_API_TOKEN or PIPELINE_VERCEL_TOKEN on the server.",
    },
    {
      id: "project",
      label: "Project configuration",
      status: params.projectConfigured ? "configured" : "missing",
      detail: params.projectConfigured
        ? "A Vercel project ID is configured for admin reads."
        : "Add VERCEL_PROJECT_ID or PIPELINE_VERCEL_PROJECT_ID on the server.",
    },
    {
      id: "team",
      label: "Team scope",
      status: params.teamConfigured ? "configured" : "optional",
      detail: params.teamConfigured
        ? "Requests are scoped to the configured Vercel team."
        : "No team ID is configured. Personal-account scope will be used until VERCEL_TEAM_ID is added.",
    },
    {
      id: "deployments",
      label: "Deployment data",
      status: params.deploymentsStatus,
      detail: params.deploymentsDetail,
    },
    {
      id: "logs",
      label: "Deployment events",
      status: params.logsStatus,
      detail: params.logsDetail,
    },
    {
      id: "analytics",
      label: "Web Analytics",
      status: params.analyticsStatus,
      detail: params.analyticsDetail,
    },
    ...(params.extraChecks ?? []),
  ];
}

function buildFallbackOverview(params: {
  apiTokenConfigured: boolean;
  projectConfigured: boolean;
  teamConfigured: boolean;
  missingEnvironmentVariables: string[];
  message: string;
  diagnostics: VercelIntegrationDiagnostic[];
}): VercelIntegrationOverview {
  const analytics = buildAnalyticsUnavailableSummary({
    configured: false,
    statusLabel: "Traffic analytics unavailable",
    message: "Traffic analytics is unavailable until the Vercel deployment integration is configured.",
    dashboardHref: null,
    diagnosticCodes: ["missing-token", "missing-project-id"],
    actionItems: [
      "Set VERCEL_API_TOKEN on the server.",
      "Set VERCEL_PROJECT_ID on the server.",
      "Redeploy after the Vercel integration is configured.",
    ],
  });

  return {
    status: {
      isConfigured: params.apiTokenConfigured && params.projectConfigured,
      connectionState: "missing",
      apiTokenConfigured: params.apiTokenConfigured,
      projectConfigured: params.projectConfigured,
      teamConfigured: params.teamConfigured,
      missingEnvironmentVariables: params.missingEnvironmentVariables,
      message: params.message,
    },
    project: null,
    latestDeployment: null,
    deploymentDetailsHref: null,
    deployments: [],
    logs: buildLogsUnavailableSummary({
      message: "Logs unavailable from API until the Vercel deployment integration is configured.",
      dashboardHref: null,
      diagnosticCodes: ["logs-unavailable"],
    }),
    analytics,
    checks: createChecks({
      apiTokenConfigured: params.apiTokenConfigured,
      projectConfigured: params.projectConfigured,
      teamConfigured: params.teamConfigured,
      deploymentsStatus: "missing",
      deploymentsDetail: params.message,
      logsStatus: "unavailable",
      logsDetail: "Deployment events cannot be queried until the Vercel integration is configured.",
      analyticsStatus: "missing",
      analyticsDetail: "Vercel Web Analytics cannot be queried until the server-side Vercel integration is configured.",
      extraChecks: analytics.checks,
    }),
    diagnostics: params.diagnostics,
    fetchedAt: null,
  };
}

function buildConnectionErrorOverview(params: {
  apiTokenConfigured: boolean;
  projectConfigured: boolean;
  teamConfigured: boolean;
  missingEnvironmentVariables: string[];
  diagnostics: VercelIntegrationDiagnostic[];
}): VercelIntegrationOverview {
  const connectionMessage =
    "Vercel is configured, but the API response could not be loaded safely. Verify token scope, project ID, and the optional team ID.";
  const analytics = buildAnalyticsUnavailableSummary({
    configured: false,
    statusLabel: "Traffic analytics unavailable",
    message: "Traffic analytics could not be evaluated because the Vercel API request failed safely.",
    dashboardHref: null,
    diagnosticCodes: ["provider-error"],
    actionItems: [
      "Verify the Vercel token scope for this project.",
      "Verify the configured VERCEL_PROJECT_ID and optional VERCEL_TEAM_ID.",
      "Retry after the Vercel project and team settings are confirmed.",
    ],
  });

  return {
    status: {
      isConfigured: params.apiTokenConfigured && params.projectConfigured,
      connectionState: "error",
      apiTokenConfigured: params.apiTokenConfigured,
      projectConfigured: params.projectConfigured,
      teamConfigured: params.teamConfigured,
      missingEnvironmentVariables: params.missingEnvironmentVariables,
      message: connectionMessage,
    },
    project: null,
    latestDeployment: null,
    deploymentDetailsHref: null,
    deployments: [],
    logs: buildLogsUnavailableSummary({
      message: "Logs unavailable from API because the deployment request could not be completed safely.",
      dashboardHref: null,
      diagnosticCodes: ["logs-unavailable"],
    }),
    analytics,
    checks: createChecks({
      apiTokenConfigured: params.apiTokenConfigured,
      projectConfigured: params.projectConfigured,
      teamConfigured: params.teamConfigured,
      deploymentsStatus: "unavailable",
      deploymentsDetail: connectionMessage,
      logsStatus: "unavailable",
      logsDetail: "Deployment events could not be queried because the Vercel API request failed safely.",
      analyticsStatus: "unavailable",
      analyticsDetail: "Vercel Web Analytics could not be evaluated because the Vercel API request failed safely.",
      extraChecks: analytics.checks,
    }),
    diagnostics: params.diagnostics,
    fetchedAt: null,
  };
}

function createDiagnosticFromCode(
  code: VercelDiagnosticCode,
  params: { logs: VercelLogsSummary; analytics: VercelAnalyticsSummary },
): VercelIntegrationDiagnostic | null {
  if (code === "logs-unavailable") {
    return createDiagnostic({
      code,
      tone: "warning",
      label: "Deployment logs unavailable",
      detail: params.logs.message,
    });
  }

  if (code === "missing-team-id") {
    return createDiagnostic({
      code,
      tone: "warning",
      label: "Team scope not configured",
      detail: "Team-owned Vercel projects can require VERCEL_TEAM_ID for deployment and analytics reads.",
    });
  }

  if (code === "analytics-package-missing") {
    return createDiagnostic({
      code,
      tone: "error",
      label: "Analytics package missing",
      detail: "Install @vercel/analytics and redeploy so the app can emit Vercel Web Analytics page-view beacons.",
    });
  }

  if (code === "analytics-component-missing") {
    return createDiagnostic({
      code,
      tone: "error",
      label: "Analytics component missing",
      detail: "Render <Analytics /> from @vercel/analytics/next in the root Next.js App Router layout and redeploy.",
    });
  }

  if (code === "unauthorized") {
    return createDiagnostic({
      code,
      tone: "error",
      label: "Unauthorized Vercel access",
      detail: "The configured token cannot read one or more required Vercel admin resources for this project.",
    });
  }

  if (code === "forbidden") {
    return createDiagnostic({
      code,
      tone: "error",
      label: "Forbidden Vercel access",
      detail: "The configured token can reach Vercel, but it does not have permission to read the requested resource for this project.",
    });
  }

  if (code === "rate-limited") {
    return createDiagnostic({
      code,
      tone: "warning",
      label: "Vercel API rate-limited",
      detail: "Vercel limited one of the admin API reads. Retry after the current rate-limit window resets.",
    });
  }

  if (code === "analytics-disabled") {
    return createDiagnostic({
      code,
      tone: "warning",
      label: "Web Analytics not reported by project",
      detail: "Enable Web Analytics in the Vercel project settings and redeploy so the analytics intake routes are attached.",
    });
  }

  if (code === "no-data-yet") {
    return createDiagnostic({
      code,
      tone: "info",
      label: "No Vercel analytics data yet",
      detail: "Vercel Web Analytics is reachable, but the selected time windows do not contain traffic data yet. Visit the production domain to generate the first page views.",
    });
  }

  if (code === "unsupported-query-shape") {
    return createDiagnostic({
      code,
      tone: "warning",
      label: "Web Analytics query rejected",
      detail: "Vercel rejected the current server-side Web Analytics query shape for this project.",
    });
  }

  if (code === "unsupported-endpoint") {
    return createDiagnostic({
      code,
      tone: "warning",
      label: "Web Analytics endpoint unavailable",
      detail: "The configured token or team scope cannot reach Vercel's public Web Analytics endpoint for this project.",
    });
  }

  if (code === "provider-error" || code === "analytics-unavailable") {
    return createDiagnostic({
      code,
      tone: "warning",
      label: "Web Analytics unavailable",
      detail: params.analytics.message,
    });
  }

  if (code === "no-deployments") {
    return createDiagnostic({
      code,
      tone: "warning",
      label: "No deployments returned",
      detail: "No deployment records are available yet, so deployment-event summaries cannot be loaded.",
    });
  }

  return null;
}

export function formatVercelState(state: string | null | undefined): string {
  if (!state) {
    return "Unknown";
  }

  return state
    .toLowerCase()
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatVercelDuration(durationMs: number | null | undefined): string {
  if (durationMs === null || durationMs === undefined || durationMs < 0) {
    return "Unavailable";
  }

  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }

  const totalSeconds = Math.round(durationMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

export async function getVercelIntegrationOverview(): Promise<VercelIntegrationOverview> {
  const context = resolveVercelContext();
  const apiTokenConfigured = Boolean(context.token);
  const projectConfigured = Boolean(context.projectId);
  const teamConfigured = Boolean(context.teamId);
  const isConfigured = apiTokenConfigured && projectConfigured;
  const missingEnvironmentVariables = resolveMissingEnvironmentVariables(context);
  const baseDiagnostics = buildBaseDiagnostics({
    apiTokenConfigured,
    projectConfigured,
    teamConfigured,
  });

  if (!isConfigured) {
    const setupMessage =
      missingEnvironmentVariables.length > 0
        ? `Vercel integration requires ${missingEnvironmentVariables.join(" and ")} on the server.`
        : "Vercel integration is not configured yet.";

    return buildFallbackOverview({
      apiTokenConfigured,
      projectConfigured,
      teamConfigured,
      missingEnvironmentVariables,
      message: setupMessage,
      diagnostics: baseDiagnostics,
    });
  }

  try {
    const [projectResponse, deploymentsResponse] = await Promise.all([
      fetchVercelJson<VercelProjectResponse>(context, `/v9/projects/${context.projectId}`),
      fetchVercelJson<VercelDeploymentsListResponse>(context, "/v6/deployments", {
        projectId: context.projectId,
        limit: RECENT_DEPLOYMENTS_LIMIT,
      }),
    ]);

    const deployments = (readArray(deploymentsResponse.deployments) ?? [])
      .map((deployment) => mapDeploymentSummary(deployment as VercelDeploymentResponse))
      .sort((left, right) => parseSortableTime(right.createdAt) - parseSortableTime(left.createdAt));

    const project: VercelProjectSummary = {
      id: readString(projectResponse.id) ?? context.projectId ?? "unknown-project",
      name: readString(projectResponse.name) ?? "Configured Vercel project",
      framework: readString(projectResponse.framework),
      nodeVersion: readString(projectResponse.nodeVersion),
      productionBranch: readString(projectResponse.productionBranch),
      analyticsEnabled: hasProjectFeature(projectResponse, ["analytics", "webAnalytics", "analyticsId"], [
        "analytics",
        "webAnalytics",
      ]),
      speedInsightsEnabled: hasProjectFeature(projectResponse, ["speedInsights"], ["speedInsights"]),
    };

    const latestDeployment = deployments[0] ?? null;
    const deploymentDetailsHref = latestDeployment?.inspectUrl ?? null;
    const [logs, analytics] = await Promise.all([
      getDeploymentLogsSummary(context, latestDeployment),
      getVercelAnalyticsSummary({
        context,
        project,
        dashboardHref: latestDeployment?.inspectUrl ?? null,
      }),
    ]);

    const diagnostics = [...baseDiagnostics];

    if (deployments.length === 0) {
      pushUniqueDiagnostic(
        diagnostics,
        createDiagnostic({
          code: "no-deployments",
          tone: "warning",
          label: "No deployments returned",
          detail: "Vercel is connected, but the configured project did not return any deployment records yet.",
        }),
      );
    }

    const diagnosticCodes = new Set<VercelDiagnosticCode>([
      ...logs.diagnosticCodes,
      ...analytics.diagnosticCodes,
      ...baseDiagnostics.map((entry) => entry.code),
    ]);

    if (deployments.length === 0) {
      diagnosticCodes.add("no-deployments");
    }

    for (const code of diagnosticCodes) {
      const diagnostic = createDiagnosticFromCode(code, { logs, analytics });
      if (diagnostic) {
        pushUniqueDiagnostic(diagnostics, diagnostic);
      }
    }

    const deploymentsDetail =
      deployments.length > 0
        ? "Recent deployment data is available to the admin dashboard."
        : "Vercel is connected, but no deployment records were returned for the configured project yet.";

    return {
      status: {
        isConfigured,
        connectionState: "connected",
        apiTokenConfigured,
        projectConfigured,
        teamConfigured,
        missingEnvironmentVariables,
        message:
          deployments.length > 0
            ? "Vercel integration is connected for deployment reads."
            : "Vercel integration is connected, but no deployment records are available yet.",
      },
      project,
      latestDeployment,
      deploymentDetailsHref,
      deployments,
      logs,
      analytics,
      checks: createChecks({
        apiTokenConfigured,
        projectConfigured,
        teamConfigured,
        deploymentsStatus: deployments.length > 0 ? "available" : "unavailable",
        deploymentsDetail,
        logsStatus: logs.available ? "available" : "unavailable",
        logsDetail: logs.message,
        analyticsStatus: analytics.available ? "available" : analytics.configured ? "configured" : "unavailable",
        analyticsDetail: analytics.message,
        extraChecks: analytics.checks,
      }),
      diagnostics,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    logger.warn("Vercel admin integration fell back to a safe error state", {
      category: "error",
      service: "vercel",
      error: {
        message: error instanceof Error ? error.message : String(error),
        name: "VercelAdminIntegrationWarning",
      },
    });

    const diagnostics = [...baseDiagnostics];

    if (error instanceof VercelApiError) {
      if (error.statusCode === 401) {
        pushUniqueDiagnostic(
          diagnostics,
          createDiagnostic({
            code: "unauthorized",
            tone: "error",
            label: "Unauthorized Vercel access",
            detail: "The configured token cannot read the Vercel project or deployment records for this admin view.",
          }),
        );
      }

      if (error.statusCode === 403 || error.code === "forbidden") {
        pushUniqueDiagnostic(
          diagnostics,
          createDiagnostic({
            code: "forbidden",
            tone: "error",
            label: "Forbidden Vercel access",
            detail: "The configured token can reach Vercel, but it cannot read the Vercel project or deployment records for this admin view.",
          }),
        );
      }

      if (error.statusCode === 429 || error.code === "rate_limited") {
        pushUniqueDiagnostic(
          diagnostics,
          createDiagnostic({
            code: "rate-limited",
            tone: "warning",
            label: "Vercel API rate-limited",
            detail: "The Vercel deployment read was rate-limited. Retry after the current rate-limit window resets.",
          }),
        );
      }
    }

    pushUniqueDiagnostic(
      diagnostics,
      createDiagnostic({
        code: "logs-unavailable",
        tone: "warning",
        label: "Deployment logs unavailable",
        detail: "Build and deployment event summaries could not be loaded because the base Vercel request failed safely.",
      }),
    );
    pushUniqueDiagnostic(
      diagnostics,
      createDiagnostic({
        code: "provider-error",
        tone: "warning",
        label: "Web Analytics unavailable",
        detail: "Vercel Web Analytics could not be evaluated because the base Vercel request failed safely.",
      }),
    );

    return buildConnectionErrorOverview({
      apiTokenConfigured,
      projectConfigured,
      teamConfigured,
      missingEnvironmentVariables,
      diagnostics,
    });
  }
}

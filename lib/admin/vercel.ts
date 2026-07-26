import "server-only";

import { config } from "@/config";
import { logger } from "@/lib/observability";

const REQUEST_TIMEOUT_MS = 10_000;
const RECENT_DEPLOYMENTS_LIMIT = 6;
const RECENT_DEPLOYMENT_EVENT_LIMIT = 24;

export type VercelCheckStatus = "configured" | "missing" | "available" | "unavailable" | "optional";
export type VercelConnectionState = "connected" | "missing" | "error";
export type VercelDiagnosticCode =
  | "missing-token"
  | "missing-project-id"
  | "missing-team-id"
  | "unauthorized"
  | "rate-limited"
  | "logs-unavailable"
  | "analytics-unavailable"
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

export interface VercelAnalyticsSummary {
  available: boolean;
  configured: boolean;
  statusLabel: string;
  message: string;
  dashboardHref: string | null;
  diagnosticCodes: VercelDiagnosticCode[];
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
  speedInsights?: unknown;
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
        detail: "Set VERCEL_PROJECT_ID or PIPELINE_VERCEL_PROJECT_ID so deployment reads target the correct Vercel project.",
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
        detail: "Team-scoped Vercel API calls can remain incomplete until VERCEL_TEAM_ID is set. Personal-account reads may still work.",
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
      if (error.statusCode === 401 || error.statusCode === 403 || error.code === "forbidden") {
        return buildLogsUnavailableSummary({
          message: "Logs unavailable from API because the configured token cannot read deployment events for this project.",
          dashboardHref: latestDeployment.inspectUrl,
          diagnosticCodes: ["unauthorized", "logs-unavailable"],
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

function buildAnalyticsSummary(params: {
  project: VercelProjectSummary | null;
  deploymentDashboardHref: string | null;
}): VercelAnalyticsSummary {
  if (!params.project) {
    return {
      available: false,
      configured: false,
      statusLabel: "Traffic analytics unavailable",
      message: "Traffic analytics availability could not be evaluated because the Vercel project metadata was not loaded safely.",
      dashboardHref: params.deploymentDashboardHref,
      diagnosticCodes: ["analytics-unavailable"],
    };
  }

  const configured = params.project.analyticsEnabled || params.project.speedInsightsEnabled;

  if (!configured) {
    return {
      available: false,
      configured: false,
      statusLabel: "Traffic analytics not configured",
      message: "The connected Vercel project does not currently report Web Analytics or Speed Insights enabled.",
      dashboardHref: params.deploymentDashboardHref,
      diagnosticCodes: ["analytics-unavailable"],
    };
  }

  return {
    available: false,
    configured: true,
    statusLabel: "Traffic analytics unavailable",
    message: "The project reports Vercel Analytics or Speed Insights enabled, but this admin panel does not query Vercel traffic metrics yet.",
    dashboardHref: params.deploymentDashboardHref,
    diagnosticCodes: ["analytics-unavailable"],
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
      label: "Analytics readiness",
      status: params.analyticsStatus,
      detail: params.analyticsDetail,
    },
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
    analytics: {
      available: false,
      configured: false,
      statusLabel: "Traffic analytics unavailable",
      message: "Traffic analytics is unavailable until the Vercel deployment integration is configured.",
      dashboardHref: null,
      diagnosticCodes: ["analytics-unavailable"],
    },
    checks: createChecks({
      apiTokenConfigured: params.apiTokenConfigured,
      projectConfigured: params.projectConfigured,
      teamConfigured: params.teamConfigured,
      deploymentsStatus: "missing",
      deploymentsDetail: params.message,
      logsStatus: "unavailable",
      logsDetail: "Deployment events cannot be queried until the Vercel integration is configured.",
      analyticsStatus: "missing",
      analyticsDetail: "Traffic analytics cannot be evaluated until the Vercel deployment integration is configured.",
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
    analytics: {
      available: false,
      configured: false,
      statusLabel: "Traffic analytics unavailable",
      message: "Traffic analytics could not be evaluated because the Vercel API request failed safely.",
      dashboardHref: null,
      diagnosticCodes: ["analytics-unavailable"],
    },
    checks: createChecks({
      apiTokenConfigured: params.apiTokenConfigured,
      projectConfigured: params.projectConfigured,
      teamConfigured: params.teamConfigured,
      deploymentsStatus: "unavailable",
      deploymentsDetail: connectionMessage,
      logsStatus: "unavailable",
      logsDetail: "Deployment events could not be queried because the Vercel API request failed safely.",
      analyticsStatus: "unavailable",
      analyticsDetail: "Traffic analytics could not be evaluated because the Vercel API request failed safely.",
    }),
    diagnostics: params.diagnostics,
    fetchedAt: null,
  };
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
      analyticsEnabled: hasAnalyticsFeature(projectResponse.analytics),
      speedInsightsEnabled: hasAnalyticsFeature(projectResponse.speedInsights),
    };

    const latestDeployment = deployments[0] ?? null;
    const deploymentDetailsHref = latestDeployment?.inspectUrl ?? null;
    const logs = await getDeploymentLogsSummary(context, latestDeployment);
    const analytics = buildAnalyticsSummary({
      project,
      deploymentDashboardHref: latestDeployment?.inspectUrl ?? null,
    });

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

    for (const code of logs.diagnosticCodes) {
      if (code === "logs-unavailable") {
        pushUniqueDiagnostic(
          diagnostics,
          createDiagnostic({
            code,
            tone: "warning",
            label: "Deployment logs unavailable",
            detail: logs.message,
          }),
        );
      }

      if (code === "unauthorized") {
        pushUniqueDiagnostic(
          diagnostics,
          createDiagnostic({
            code,
            tone: "error",
            label: "Unauthorized Vercel access",
            detail: "The configured token can reach Vercel, but it cannot read all requested deployment details for this project.",
          }),
        );
      }

      if (code === "rate-limited") {
        pushUniqueDiagnostic(
          diagnostics,
          createDiagnostic({
            code,
            tone: "warning",
            label: "Vercel API rate-limited",
            detail: "Vercel limited one of the admin API reads. Retry after the rate-limit window resets.",
          }),
        );
      }

      if (code === "no-deployments") {
        pushUniqueDiagnostic(
          diagnostics,
          createDiagnostic({
            code,
            tone: "warning",
            label: "No deployments returned",
            detail: "No deployment records are available yet, so deployment-event summaries cannot be loaded.",
          }),
        );
      }
    }

    for (const code of analytics.diagnosticCodes) {
      if (code === "analytics-unavailable") {
        pushUniqueDiagnostic(
          diagnostics,
          createDiagnostic({
            code,
            tone: analytics.configured ? "warning" : "info",
            label: analytics.configured ? "Analytics configured but unavailable" : "Analytics unavailable",
            detail: analytics.message,
          }),
        );
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
      if (error.statusCode === 401 || error.statusCode === 403 || error.code === "forbidden") {
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
        code: "analytics-unavailable",
        tone: "warning",
        label: "Analytics unavailable",
        detail: "Traffic analytics readiness could not be evaluated because the base Vercel request failed safely.",
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

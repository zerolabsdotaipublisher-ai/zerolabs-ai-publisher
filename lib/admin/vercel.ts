import "server-only";

import { config } from "@/config";
import { logger } from "@/lib/observability";

const REQUEST_TIMEOUT_MS = 10_000;

export type VercelCheckStatus = "configured" | "missing" | "available" | "unavailable" | "optional";
export type VercelConnectionState = "connected" | "missing" | "error";

export interface VercelIntegrationCheck {
  id: string;
  label: string;
  status: VercelCheckStatus;
  detail: string;
}

export interface VercelDeploymentSummary {
  id: string;
  name: string;
  url: string | null;
  inspectUrl: string | null;
  state: string;
  createdAt: string | null;
  branch: string | null;
  commitSha: string | null;
  target: string | null;
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

export interface VercelAnalyticsSummary {
  available: boolean;
  message: string;
}

export interface VercelIntegrationOverview {
  status: {
    isConfigured: boolean;
    connectionState: VercelConnectionState;
    apiTokenConfigured: boolean;
    projectConfigured: boolean;
    teamConfigured: boolean;
    message: string;
  };
  project: VercelProjectSummary | null;
  latestDeployment: VercelDeploymentSummary | null;
  deployments: VercelDeploymentSummary[];
  analytics: VercelAnalyticsSummary;
  checks: VercelIntegrationCheck[];
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
  uid?: unknown;
  name?: unknown;
  url?: unknown;
  inspectorUrl?: unknown;
  state?: unknown;
  createdAt?: unknown;
  target?: unknown;
  meta?: unknown;
};

type VercelDeploymentsListResponse = {
  deployments?: unknown;
};

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

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function toIsoString(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
  }

  return null;
}

function normalizeDeploymentUrl(value: unknown): string | null {
  const url = readString(value);

  if (!url) {
    return null;
  }

  return url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  const record = readRecord(error);
  const message = readString(record?.message);
  if (message) {
    return message;
  }

  const nestedError = record?.error;
  if (typeof nestedError === "string" && nestedError.trim().length > 0) {
    return nestedError.trim();
  }

  const nestedRecord = readRecord(nestedError);
  return readString(nestedRecord?.message) ?? "Unknown Vercel integration error.";
}

function resolveVercelContext(): VercelApiContext {
  return {
    apiUrl: config.services.pipeline.vercel.apiUrl,
    token: config.services.pipeline.vercel.token,
    projectId: config.services.pipeline.vercel.projectId,
    teamId: config.services.pipeline.vercel.teamId,
  };
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
      throw new Error(extractErrorMessage(payload));
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

function mapDeploymentSummary(input: VercelDeploymentResponse): VercelDeploymentSummary {
  const meta = readRecord(input.meta);

  return {
    id: readString(input.uid) ?? "unknown-deployment",
    name: readString(input.name) ?? "Vercel deployment",
    url: normalizeDeploymentUrl(input.url),
    inspectUrl: normalizeDeploymentUrl(input.inspectorUrl),
    state: readString(input.state) ?? "UNKNOWN",
    createdAt: toIsoString(input.createdAt),
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
    target: readString(input.target),
  };
}

function createChecks(params: {
  apiTokenConfigured: boolean;
  projectConfigured: boolean;
  teamConfigured: boolean;
  analyticsAvailable: boolean;
  deploymentsAvailable: boolean;
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
        : "No team ID is configured. Personal-account scope will be used.",
    },
    {
      id: "deployments",
      label: "Deployment data",
      status: params.deploymentsAvailable ? "available" : "unavailable",
      detail: params.deploymentsAvailable
        ? "Recent deployment data is available to the admin dashboard."
        : "Recent deployment data could not be loaded yet.",
    },
    {
      id: "analytics",
      label: "Analytics availability",
      status: params.analyticsAvailable ? "available" : "unavailable",
      detail: params.analyticsAvailable
        ? "Project analytics or Speed Insights metadata is available."
        : "Analytics will appear once Vercel integration is configured.",
    },
  ];
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

export async function getVercelIntegrationOverview(): Promise<VercelIntegrationOverview> {
  const context = resolveVercelContext();
  const apiTokenConfigured = Boolean(context.token);
  const projectConfigured = Boolean(context.projectId);
  const teamConfigured = Boolean(context.teamId);
  const isConfigured = apiTokenConfigured && projectConfigured;

  if (!isConfigured) {
    return {
      status: {
        isConfigured,
        connectionState: "missing",
        apiTokenConfigured,
        projectConfigured,
        teamConfigured,
        message: "Vercel integration is not configured yet.",
      },
      project: null,
      latestDeployment: null,
      deployments: [],
      analytics: {
        available: false,
        message: "Analytics will appear once Vercel integration is configured.",
      },
      checks: createChecks({
        apiTokenConfigured,
        projectConfigured,
        teamConfigured,
        analyticsAvailable: false,
        deploymentsAvailable: false,
      }),
      fetchedAt: null,
    };
  }

  try {
    const [projectResponse, deploymentsResponse] = await Promise.all([
      fetchVercelJson<VercelProjectResponse>(context, `/v9/projects/${context.projectId}`),
      fetchVercelJson<VercelDeploymentsListResponse>(context, "/v6/deployments", {
        projectId: context.projectId,
        limit: 6,
      }),
    ]);

    const deployments = Array.isArray(deploymentsResponse.deployments)
      ? deploymentsResponse.deployments
          .map((deployment) => mapDeploymentSummary(deployment as VercelDeploymentResponse))
          .sort((left, right) => parseSortableTime(right.createdAt) - parseSortableTime(left.createdAt))
      : [];

    const analyticsAvailable =
      hasAnalyticsFeature(projectResponse.analytics) || hasAnalyticsFeature(projectResponse.speedInsights);

    const project: VercelProjectSummary = {
      id: readString(projectResponse.id) ?? context.projectId ?? "unknown-project",
      name: readString(projectResponse.name) ?? "Configured Vercel project",
      framework: readString(projectResponse.framework),
      nodeVersion: readString(projectResponse.nodeVersion),
      productionBranch: readString(projectResponse.productionBranch),
      analyticsEnabled: hasAnalyticsFeature(projectResponse.analytics),
      speedInsightsEnabled: hasAnalyticsFeature(projectResponse.speedInsights),
    };

    return {
      status: {
        isConfigured,
        connectionState: "connected",
        apiTokenConfigured,
        projectConfigured,
        teamConfigured,
        message: "Vercel integration is connected.",
      },
      project,
      latestDeployment: deployments[0] ?? null,
      deployments,
      analytics: {
        available: analyticsAvailable,
        message: analyticsAvailable
          ? "Analytics metadata is available from the configured Vercel project."
          : "Analytics will appear once Vercel integration is configured.",
      },
      checks: createChecks({
        apiTokenConfigured,
        projectConfigured,
        teamConfigured,
        analyticsAvailable,
        deploymentsAvailable: deployments.length > 0,
      }),
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

    return {
      status: {
        isConfigured,
        connectionState: "error",
        apiTokenConfigured,
        projectConfigured,
        teamConfigured,
        message: "Vercel integration is configured, but the API response could not be loaded safely.",
      },
      project: null,
      latestDeployment: null,
      deployments: [],
      analytics: {
        available: false,
        message: "Analytics will appear once Vercel integration is configured.",
      },
      checks: createChecks({
        apiTokenConfigured,
        projectConfigured,
        teamConfigured,
        analyticsAvailable: false,
        deploymentsAvailable: false,
      }),
      fetchedAt: null,
    };
  }
}

import { PipelineDeploymentError } from "../errors";
import { buildDomainAssignments, createGeneratedDomain } from "../hosting/domains";
import { createHostingLog } from "../hosting/logs";
import { createHostingSecurityMetadata } from "../hosting/security";
import { getDeploymentInProgressStatus, mapVercelStateToPipelineStatus } from "../hosting/status";
import { createDeploymentStatusRecord, markDeploymentReady } from "../status";
import { assignDeploymentUrl } from "../urls";
import type {
  PipelineHostingError,
  PipelineHostingLogEntry,
  PipelineDeploymentRequest,
  PipelineDeploymentResult,
  PipelineRuntimeConfig,
} from "../types";
import type { DeploymentAdapter } from "./types";

interface VercelDeployHookResponse {
  id?: string;
  url?: string;
  state?: string;
  createdAt?: number;
  [key: string]: unknown;
}

const MIN_DEPLOY_HOOK_TIMEOUT_MS = 1000;

function normalizeProviderUrl(url: string | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
}

function getDeployHookUrl(
  runtimeConfig: PipelineRuntimeConfig,
  environment: PipelineDeploymentRequest["environment"],
): string | undefined {
  return environment === "production"
    ? runtimeConfig.hosting.vercel.deployHookProductionUrl
    : runtimeConfig.hosting.vercel.deployHookPreviewUrl;
}

function resolveCanonicalDeploymentUrl(params: {
  generatedDomain?: string;
  fallbackUrl: string;
}): string {
  return params.generatedDomain ? `https://${params.generatedDomain}` : params.fallbackUrl;
}

function extractVercelErrorMessage(data: VercelDeployHookResponse): string {
  if (typeof data.error === "string" && data.error) {
    return data.error;
  }

  if (typeof data.message === "string" && data.message) {
    return data.message;
  }

  const errorObject = data.error;
  if (errorObject && typeof errorObject === "object") {
    const maybeMessage = (errorObject as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage) {
      return maybeMessage;
    }
  }

  return "Unknown provider error";
}

function classifyHttpStatus(status: number): "Client error" | "Server error" | "Unexpected error" {
  if (status >= 400 && status < 500) return "Client error";
  if (status >= 500) return "Server error";
  return "Unexpected error";
}

export class VercelDeploymentAdapter implements DeploymentAdapter {
  constructor(private readonly runtimeConfig: PipelineRuntimeConfig) {}

  private buildHostingError(
    message: string,
    params?: {
      code?: string;
      retryable?: boolean;
      details?: Record<string, unknown>;
    },
  ): PipelineHostingError {
    return {
      code: params?.code ?? "VERCEL_DEPLOYMENT_ERROR",
      message,
      retryable: params?.retryable ?? true,
      provider: "vercel",
      details: params?.details,
    };
  }

  private async triggerDeploymentHook(
    request: PipelineDeploymentRequest,
    deployHookUrl: string,
    logs: PipelineHostingLogEntry[],
  ): Promise<VercelDeployHookResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      Math.max(MIN_DEPLOY_HOOK_TIMEOUT_MS, this.runtimeConfig.hosting.vercel.timeoutMs),
    );

    try {
      const response = await fetch(deployHookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: `${this.runtimeConfig.hosting.vercel.projectId ?? "ai-publisher"}-${
            request.environment
          }-${request.build.manifest.structureId}`,
          target: request.environment === "production" ? "production" : "preview",
          meta: {
            structureId: request.build.manifest.structureId,
            structureVersion: request.build.manifest.structureVersion,
            buildId: request.build.buildId,
            idempotencyKey: request.idempotencyKey,
            staticPageCount: request.build.ssg.metrics.pageCount,
            staticRouteCount: request.build.ssg.metrics.routeCount,
          },
        }),
        signal: controller.signal,
      });

      const data = (await response
        .json()
        .catch((error) => {
          logs.push(
            createHostingLog("Unable to parse Vercel deploy hook JSON response.", {
              level: "warn",
              details: {
                parseError: error instanceof Error ? error.message : String(error),
              },
            }),
          );
          return {};
        })) as VercelDeployHookResponse;
      if (!response.ok) {
        throw new PipelineDeploymentError(
          `${classifyHttpStatus(response.status)} from Vercel deployment hook (${response.status}): ${extractVercelErrorMessage(
            data,
          )}`,
          { retryable: response.status >= 500 },
        );
      }

      logs.push(
        createHostingLog("Triggered Vercel deploy hook successfully.", {
          details: { responseStatus: response.status },
        }),
      );
      return data;
    } catch (error) {
      if (error instanceof PipelineDeploymentError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new PipelineDeploymentError("Vercel deployment hook timed out.", {
          retryable: true,
        });
      }

      throw new PipelineDeploymentError(
        error instanceof Error ? error.message : "Unknown Vercel deployment hook failure",
        { retryable: true },
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  async deploy(request: PipelineDeploymentRequest): Promise<PipelineDeploymentResult> {
    const assignedUrl = assignDeploymentUrl({
      structureId: request.build.manifest.structureId,
      environment: request.environment,
      runtimeConfig: this.runtimeConfig,
    });
    const generatedDomain = createGeneratedDomain({
      structureId: request.build.manifest.structureId,
      environment: request.environment,
      defaultDomain: this.runtimeConfig.hosting.vercel.defaultDomain,
    });
    const logs: PipelineHostingLogEntry[] = [];
    const baseStatus = createDeploymentStatusRecord(
      request,
      getDeploymentInProgressStatus(request.attempt),
    );
    const security = createHostingSecurityMetadata();

    const baseMetadata = {
      adapter: "vercel" as const,
      dryRun: true,
      buildId: request.build.buildId,
      manifestFormat: request.build.manifest.format,
      ssgFormat: request.build.ssg.format,
      staticPageCount: request.build.ssg.metrics.pageCount,
      staticRouteCount: request.build.ssg.metrics.routeCount,
      projectId: this.runtimeConfig.hosting.vercel.projectId,
      teamId: this.runtimeConfig.hosting.vercel.teamId,
      security,
      logs,
    };

    const deployHookUrl = getDeployHookUrl(this.runtimeConfig, request.environment);
    const canRunRealDeployment =
      this.runtimeConfig.hosting.vercel.enableRealDeployments && Boolean(deployHookUrl);

    if (
      this.runtimeConfig.hosting.vercel.enableRealDeployments &&
      !canRunRealDeployment
    ) {
      const hostingError = this.buildHostingError(
        "Real Vercel deployments are enabled but deploy hook URL is missing for this environment.",
        {
          code: "VERCEL_CONFIG_INVALID",
          retryable: false,
          details: { environment: request.environment },
        },
      );
      logs.push(
        createHostingLog(hostingError.message, {
          level: "error",
          details: hostingError.details,
        }),
      );
      throw new PipelineDeploymentError(hostingError.message, {
        retryable: hostingError.retryable,
      });
    }

    if (!canRunRealDeployment) {
      logs.push(
        createHostingLog("Vercel adapter running in safe dry-run mode.", {
          details: {
            reason: "Real deployments disabled or deploy hook URL not configured.",
          },
        }),
      );
      const url = resolveCanonicalDeploymentUrl({
        generatedDomain,
        fallbackUrl: assignedUrl.url,
      });
      const ready = markDeploymentReady(baseStatus, {
        url,
        path: assignedUrl.path,
        status: "deployed",
      });
      return {
        ...ready,
        url,
        path: assignedUrl.path,
        providerDeploymentId: `vercel_${ready.deploymentId}`,
        providerMetadata: {
          ...baseMetadata,
          domains: buildDomainAssignments({
            environment: request.environment,
            generatedDomain,
          }),
        },
      };
    }

    logs.push(
      createHostingLog("Vercel adapter running with real deploy hook integration.", {
        details: {
          environment: request.environment,
        },
      }),
    );
    const activeDeployHookUrl = deployHookUrl as string;

    try {
      const providerResponse = await this.triggerDeploymentHook(request, activeDeployHookUrl, logs);
      const providerUrl = normalizeProviderUrl(providerResponse.url);
      const mappedStatus = mapVercelStateToPipelineStatus(providerResponse.state);
      if (mappedStatus === "failed") {
        throw new PipelineDeploymentError("Vercel reported a failed deployment state.", {
          retryable: false,
        });
      }
      const url = resolveCanonicalDeploymentUrl({
        generatedDomain,
        fallbackUrl: providerUrl ?? assignedUrl.url,
      });
      const ready = markDeploymentReady(baseStatus, {
        url,
        path: assignedUrl.path,
        status: "deployed",
      });

      return {
        ...ready,
        url,
        path: assignedUrl.path,
        providerDeploymentId: providerResponse.id ?? `vercel_${ready.deploymentId}`,
        providerMetadata: {
          ...baseMetadata,
          dryRun: false,
          providerDeploymentUrl: providerUrl,
          domains: buildDomainAssignments({
            environment: request.environment,
            generatedDomain,
            providerDeploymentUrl: providerUrl,
          }),
        },
      };
    } catch (error) {
      const deploymentError =
        error instanceof PipelineDeploymentError
          ? error
          : new PipelineDeploymentError(
              error instanceof Error ? error.message : "Unknown Vercel deployment error",
            );
      const hostingError = this.buildHostingError(deploymentError.message, {
        retryable: deploymentError.retryable,
        details: {
          environment: request.environment,
        },
      });
      logs.push(
        createHostingLog(hostingError.message, {
          level: "error",
          details: hostingError.details,
        }),
      );
      throw new PipelineDeploymentError(hostingError.message, {
        retryable: hostingError.retryable,
      });
    }
  }
}

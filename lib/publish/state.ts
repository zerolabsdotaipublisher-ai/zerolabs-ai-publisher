import type { WebsiteStructure, WebsiteStructureStatus } from "@/lib/ai/structure";
import { detectPublicationState } from "./detection";
import { getPublicationMetadata, withPublicationMetadata } from "./model";
import { createDeploymentVersionId, planDeploymentUpdate } from "./versioning";
import type {
  PublicationCacheInvalidationMetadata,
  PublicationDeploymentMetadata,
  PublicationDomainSnapshot,
  PublicationStaticSiteMetadata,
  PublicationUpdateLogEntry,
  PublicationUpdatePlan,
  PublishAction,
} from "./types";

function resolveStructureStatus(
  currentStatus: WebsiteStructureStatus,
  state: "draft" | "published",
): WebsiteStructureStatus {
  if (currentStatus === "archived") {
    return "archived";
  }

  return state;
}

function uniqueSorted(values: Iterable<string>): string[] {
  return Array.from(new Set(values)).sort((left, right) => left.localeCompare(right));
}

function appendUpdateLog(
  logs: PublicationUpdateLogEntry[] | undefined,
  entry: PublicationUpdateLogEntry,
): PublicationUpdateLogEntry[] {
  return [...(logs ?? []), entry].slice(-50);
}

function createUpdateLog(
  phase: PublicationUpdateLogEntry["phase"],
  at: string,
  message: string,
  params?: {
    level?: PublicationUpdateLogEntry["level"];
    requestId?: string;
    details?: Record<string, unknown>;
  },
): PublicationUpdateLogEntry {
  return {
    at,
    phase,
    level: params?.level ?? "info",
    message,
    requestId: params?.requestId,
    details: params?.details,
  };
}

export function markDraftUpdatedForPublication(structure: WebsiteStructure, updatedAt: string): WebsiteStructure {
  const publication = getPublicationMetadata(structure);
  const detection = detectPublicationState(structure);
  const liveFingerprint = publication.updates?.liveFingerprint;
  const pending = detection.neverPublished
    ? undefined
    : planDeploymentUpdate(structure, { liveFingerprint, includeManualTrigger: false });
  let nextState = publication.state;

  if (detection.neverPublished) {
    nextState = "draft";
  } else if (pending?.required) {
    nextState = "update_pending";
  } else {
    nextState = "published";
  }

  return withPublicationMetadata(
    {
      ...structure,
      updatedAt,
      status: resolveStructureStatus(structure.status, detection.neverPublished ? "draft" : "published"),
    },
    {
      ...publication,
      state: nextState,
      lastDraftUpdatedAt: updatedAt,
      lastError: pending?.required ? publication.lastError : undefined,
      updates: {
        ...publication.updates,
        pending,
      },
    },
  );
}

export function markPublishing(
  structure: WebsiteStructure,
  params: {
    attemptedAt: string;
    action: PublishAction;
    requestId: string;
    updatePlan: PublicationUpdatePlan;
  },
): WebsiteStructure {
  const publication = getPublicationMetadata(structure);
  const isUpdate = params.action === "update";

  return withPublicationMetadata(
    {
      ...structure,
      updatedAt: params.attemptedAt,
    },
    {
      ...publication,
      state: "publishing",
      lastPublishAttemptAt: params.attemptedAt,
      lastError: undefined,
      deployment: {
        ...publication.deployment,
        environment: "production",
        status: isUpdate ? "updating" : "deploying",
        attempts: (publication.deployment?.attempts ?? 0) + 1,
        updatedAt: params.attemptedAt,
        lastError: undefined,
      },
      updates: {
        ...publication.updates,
        pending: params.action === "update" ? params.updatePlan : undefined,
        queue: {
          ...(publication.updates?.queue ?? { duplicateRequests: 0 }),
          activeRequestId: params.requestId,
          requestedAt: params.attemptedAt,
          startedAt: params.attemptedAt,
          completedAt: undefined,
        },
        current: {
          requestId: params.requestId,
          action: params.action,
          status: "running",
          requestedAt: params.attemptedAt,
          startedAt: params.attemptedAt,
          update: params.updatePlan,
        },
        retry: {
          retryable: true,
          retryCount: publication.updates?.retry?.retryCount ?? 0,
          recommendedAction: "retry",
          lastAttemptAt: params.attemptedAt,
        },
        logs: appendUpdateLog(
          publication.updates?.logs,
          createUpdateLog(
            "queue",
            params.attemptedAt,
            isUpdate ? "Deployment update started." : "Initial publish started.",
            {
              requestId: params.requestId,
              details: {
                action: params.action,
                changeKinds: params.updatePlan.scope.changeKinds,
                routePaths: params.updatePlan.scope.routePaths,
              },
            },
          ),
        ),
      },
    },
  );
}

export function markPublishNoOp(
  structure: WebsiteStructure,
  params: {
    completedAt: string;
    action: PublishAction;
    requestId: string;
    updatePlan: PublicationUpdatePlan;
  },
): WebsiteStructure {
  const publication = getPublicationMetadata(structure);

  return withPublicationMetadata(
    {
      ...structure,
      updatedAt: params.completedAt,
    },
    {
      ...publication,
      state: publication.publishedVersion ? "published" : publication.state,
      lastUpdatedAt: params.completedAt,
      lastError: undefined,
      updates: {
        ...publication.updates,
        pending: undefined,
        queue: {
          ...(publication.updates?.queue ?? { duplicateRequests: 0 }),
          activeRequestId: undefined,
          completedAt: params.completedAt,
          lastCompletedRequestId: params.requestId,
        },
        current: {
          requestId: params.requestId,
          action: params.action,
          status: "noop",
          requestedAt: params.completedAt,
          completedAt: params.completedAt,
          update: params.updatePlan,
        },
        logs: appendUpdateLog(
          publication.updates?.logs,
          createUpdateLog("analysis", params.completedAt, params.updatePlan.summary, {
            requestId: params.requestId,
            details: {
              action: params.action,
            },
          }),
        ),
      },
    },
  );
}

export function markPublished(
  structure: WebsiteStructure,
  params: {
    action: PublishAction;
    requestId: string;
    liveUrl: string;
    livePath: string;
    publishedAt: string;
    updatePlan: PublicationUpdatePlan;
    cache: PublicationCacheInvalidationMetadata;
    domain: PublicationDomainSnapshot;
    staticSite: PublicationStaticSiteMetadata;
    deployment?: PublicationDeploymentMetadata;
  },
): WebsiteStructure {
  const publication = getPublicationMetadata(structure);
  const firstPublishedAt = publication.firstPublishedAt || params.publishedAt;
  const previousLiveVersionId = publication.updates?.liveVersionId;
  const liveVersionId = createDeploymentVersionId(structure);
  const rollback = {
    providerSupport: "metadata-only" as const,
    rollbackReady: true,
    currentVersionId: liveVersionId,
    previousStableVersionId: previousLiveVersionId,
  };
  const nextHistory = [
    ...(publication.updates?.history ?? []).map((entry) => ({
      ...entry,
      live: false,
      rollback: {
        ...entry.rollback,
        currentVersionId: liveVersionId,
      },
    })),
    {
      versionId: liveVersionId,
      structureVersion: structure.version,
      publishedAt: params.publishedAt,
      deploymentId: params.deployment?.deploymentId,
      providerDeploymentId: params.deployment?.providerDeploymentId,
      status: params.deployment?.status ?? "deployed",
      live: true,
      liveUrl: params.liveUrl,
      livePath: params.livePath,
      domains: params.domain.domains,
      update: params.updatePlan,
      cache: params.cache,
      domain: params.domain,
      staticSite: params.staticSite,
      rollback,
      logs: params.deployment?.logs,
    },
  ].slice(-10);

  return withPublicationMetadata(
    {
      ...structure,
      updatedAt: params.publishedAt,
      status: resolveStructureStatus(structure.status, "published"),
    },
    {
      ...publication,
      state: "published",
      publishedVersion: structure.version,
      liveUrl: params.liveUrl,
      livePath: params.livePath,
      deployment: params.deployment ?? publication.deployment,
      firstPublishedAt,
      lastPublishedAt: params.publishedAt,
      lastUpdatedAt: params.publishedAt,
      lastError: undefined,
      updates: {
        ...publication.updates,
        liveVersionId,
        liveFingerprint: params.updatePlan.fingerprint,
        pending: undefined,
        retry: {
          retryable: true,
          retryCount: 0,
          recommendedAction: "retry",
          lastAttemptAt: params.publishedAt,
        },
        rollback,
        cache: params.cache,
        domain: params.domain,
        staticSite: params.staticSite,
        history: nextHistory,
        queue: {
          ...(publication.updates?.queue ?? { duplicateRequests: 0 }),
          activeRequestId: undefined,
          completedAt: params.publishedAt,
          lastCompletedRequestId: params.requestId,
        },
        current: {
          requestId: params.requestId,
          action: params.action,
          status: "succeeded",
          requestedAt: publication.updates?.current?.requestedAt ?? params.publishedAt,
          startedAt: publication.updates?.current?.startedAt ?? params.publishedAt,
          completedAt: params.publishedAt,
          update: params.updatePlan,
        },
        logs: appendUpdateLog(
          publication.updates?.logs,
          createUpdateLog(
            "completion",
            params.publishedAt,
            params.action === "publish" ? "Website publish completed." : "Website deployment update completed.",
            {
              requestId: params.requestId,
              details: {
                cacheStrategy: params.cache.strategy,
                routePaths: params.cache.affectedPaths,
                domains: params.domain.domains,
              },
            },
          ),
        ),
      },
    },
  );
}

export function markPublishFailure(
  structure: WebsiteStructure,
  params: {
    failureRecordedAt: string;
    action: PublishAction;
    requestId: string;
    errorMessage: string;
    retryable: boolean;
    updatePlan: PublicationUpdatePlan;
  },
): WebsiteStructure {
  const publication = getPublicationMetadata(structure);
  const retryCount = (publication.updates?.retry?.retryCount ?? 0) + 1;

  return withPublicationMetadata(
    {
      ...structure,
      updatedAt: params.failureRecordedAt,
    },
    {
      ...publication,
      state: "update_failed",
      lastPublishAttemptAt: params.failureRecordedAt,
      lastError: params.errorMessage,
      deployment: {
        ...publication.deployment,
        environment: publication.deployment?.environment ?? "production",
        status: "failed",
        updatedAt: params.failureRecordedAt,
        lastError: params.errorMessage,
      },
      updates: {
        ...publication.updates,
        pending: params.action === "update" ? params.updatePlan : publication.updates?.pending,
        retry: {
          retryable: params.retryable,
          retryCount,
          recommendedAction: params.retryable ? "retry" : "fix_and_retry",
          lastAttemptAt: params.failureRecordedAt,
        },
        queue: {
          ...(publication.updates?.queue ?? { duplicateRequests: 0 }),
          activeRequestId: undefined,
          completedAt: params.failureRecordedAt,
          lastCompletedRequestId: params.requestId,
        },
        current: {
          requestId: params.requestId,
          action: params.action,
          status: "failed",
          requestedAt: publication.updates?.current?.requestedAt ?? params.failureRecordedAt,
          startedAt: publication.updates?.current?.startedAt ?? params.failureRecordedAt,
          completedAt: params.failureRecordedAt,
          error: params.errorMessage,
          retryable: params.retryable,
          update: params.updatePlan,
        },
        logs: appendUpdateLog(
          publication.updates?.logs,
          createUpdateLog("retry", params.failureRecordedAt, params.errorMessage, {
            level: "error",
            requestId: params.requestId,
            details: {
              action: params.action,
              retryable: params.retryable,
              retryCount,
            },
          }),
        ),
      },
    },
  );
}

export function incrementQueuedDuplicateRequest(structure: WebsiteStructure): WebsiteStructure {
  const publication = getPublicationMetadata(structure);
  const duplicateRequests = (publication.updates?.queue?.duplicateRequests ?? 0) + 1;

  return withPublicationMetadata(structure, {
    ...publication,
    updates: {
      ...publication.updates,
      queue: {
        ...(publication.updates?.queue ?? { duplicateRequests: 0 }),
        duplicateRequests,
      },
      logs: appendUpdateLog(
        publication.updates?.logs,
        createUpdateLog("queue", structure.updatedAt, "Duplicate deployment update request ignored.", {
          level: "warn",
          details: {
            duplicateRequests,
          },
        }),
      ),
    },
  });
}

export function createDefaultUpdatePlan(structure: WebsiteStructure): PublicationUpdatePlan {
  return planDeploymentUpdate(structure, {
    liveFingerprint: getPublicationMetadata(structure).updates?.liveFingerprint,
    includeManualTrigger: false,
  });
}

export function normalizeDomainSnapshot(
  previousLiveUrl: string | undefined,
  previousLivePath: string | undefined,
  previousDomains: string[] | undefined,
  nextDomain: PublicationDomainSnapshot,
): PublicationDomainSnapshot {
  return {
    ...nextDomain,
    liveUrl: nextDomain.liveUrl,
    livePath: nextDomain.livePath,
    domains: uniqueSorted(nextDomain.domains.length > 0 ? nextDomain.domains : previousDomains ?? []),
    preservedLivePath: previousLivePath ? previousLivePath === nextDomain.livePath : nextDomain.preservedLivePath,
    preservedDomains: previousDomains
      ? domainsMatchExactly(previousDomains, nextDomain.domains)
      : nextDomain.preservedDomains,
  };
}

function domainsMatchExactly(previousDomains: string[], nextDomains: string[]): boolean {
  const previous = uniqueSorted(previousDomains);
  const next = uniqueSorted(nextDomains);
  return previous.length === next.length && previous.every((domain, index) => domain === next[index]);
}

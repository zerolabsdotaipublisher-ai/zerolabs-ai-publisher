import "server-only";

import { countInFlightInstagramJobs } from "./storage";

export interface SocialSchedulingQueuePolicy {
  maxClaimBatch: number;
  maxInFlightInstagramJobsPerUser: number;
  maxPlatformsPerExecution: number;
}

export const SOCIAL_SCHEDULING_QUEUE_POLICY: SocialSchedulingQueuePolicy = {
  maxClaimBatch: 10,
  maxInFlightInstagramJobsPerUser: 8,
  maxPlatformsPerExecution: 4,
};

export class SocialSchedulingThrottleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SocialSchedulingThrottleError";
  }
}

export async function assertSocialQueueCapacity(userId: string): Promise<void> {
  const inFlight = await countInFlightInstagramJobs(userId);
  if (inFlight >= SOCIAL_SCHEDULING_QUEUE_POLICY.maxInFlightInstagramJobsPerUser) {
    throw new SocialSchedulingThrottleError(
      "Social scheduling is temporarily throttled because Instagram publish queue is at capacity.",
    );
  }
}

export function enforcePlatformExecutionBound(platformCount: number): void {
  if (platformCount > SOCIAL_SCHEDULING_QUEUE_POLICY.maxPlatformsPerExecution) {
    throw new SocialSchedulingThrottleError("Too many platform targets for one schedule execution batch.");
  }
}

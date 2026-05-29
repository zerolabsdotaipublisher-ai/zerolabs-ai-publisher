import { config } from "@/config";
import { getOrCreateMediaQuota } from "./storage";
import type { MediaQuotaUsage } from "./types";

export interface MediaQuotaCheckResult {
  allowed: boolean;
  quotaBytes: number;
  usage: MediaQuotaUsage;
  reason?: string;
}

export async function checkMediaQuotaAllowance(input: {
  userId: string;
  tenantId: string;
  incomingBytes: number;
}): Promise<MediaQuotaCheckResult> {
  const usage = await getOrCreateMediaQuota(input.userId, input.tenantId);
  const quotaBytes = config.services.media.quotaBytesPerTenant;
  const projected = usage.totalBytes + input.incomingBytes;

  if (projected > quotaBytes) {
    return {
      allowed: false,
      quotaBytes,
      usage,
      reason: `Quota exceeded: ${projected} bytes would exceed ${quotaBytes} bytes.`,
    };
  }

  return {
    allowed: true,
    quotaBytes,
    usage,
  };
}

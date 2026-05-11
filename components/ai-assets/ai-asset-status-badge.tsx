"use client";

import type { AiAssetStatus } from "@/lib/ai-assets/types";

interface AiAssetStatusBadgeProps {
  status: AiAssetStatus;
}

const STATUS_LABELS: Record<AiAssetStatus, string> = {
  generating: "Generating",
  available: "Available",
  attached: "Attached",
  published: "Published",
  archived: "Archived",
  failed: "Failed",
  deleted: "Deleted",
};

export function AiAssetStatusBadge({ status }: AiAssetStatusBadgeProps) {
  return <span className={`ai-asset-status ai-asset-status-${status}`}>{STATUS_LABELS[status]}</span>;
}

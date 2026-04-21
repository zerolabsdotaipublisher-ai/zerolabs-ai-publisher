import type { WebsiteStructure } from "@/lib/ai/structure";
import { planDeploymentUpdate } from "@/lib/publish";
import type { WebsiteVersionComparisonSummary, WebsiteVersionRecord } from "./types";

export function summarizeWebsiteVersionComparison(
  currentStructure: WebsiteStructure,
  version: WebsiteVersionRecord,
): WebsiteVersionComparisonSummary {
  const plan = planDeploymentUpdate(currentStructure, {
    liveFingerprint: version.fingerprint,
    includeManualTrigger: false,
  });

  return {
    comparedAt: currentStructure.updatedAt,
    againstVersionId: version.id,
    againstVersionNumber: version.versionNumber,
    currentStructureVersion: currentStructure.version,
    sameAsCurrent: !plan.required,
    plan,
  };
}

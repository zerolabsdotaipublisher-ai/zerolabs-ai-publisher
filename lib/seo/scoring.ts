import type { SeoContentMetadata, SeoScoreBreakdown, SeoScoreSummary } from "./types";

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function scoreSeoContent(args: {
  titleTag: string;
  metaDescription: string;
  headingCount: number;
  internalLinkCount: number;
  readabilityScore: number;
  guardrailIssueCount: number;
}): SeoScoreSummary {
  const breakdown: SeoScoreBreakdown = {
    metadata: clamp((args.titleTag ? 50 : 0) + (args.metaDescription ? 50 : 0)),
    headings: clamp(Math.min(100, 55 + args.headingCount * 12)),
    links: clamp(Math.min(100, 40 + args.internalLinkCount * 20)),
    readability: clamp(args.readabilityScore),
    guardrails: clamp(100 - args.guardrailIssueCount * 18),
  };

  const total = clamp(
    breakdown.metadata * 0.25 +
      breakdown.headings * 0.2 +
      breakdown.links * 0.15 +
      breakdown.readability * 0.2 +
      breakdown.guardrails * 0.2,
  );

  const label = total >= 85 ? "strong" : total >= 70 ? "good" : "needs-work";

  return { total, breakdown, label };
}

export function buildReadabilityScore(metadata: Pick<SeoContentMetadata, "readability" | "length">): number {
  const sentencePenalty = Math.max(0, metadata.readability.averageWordsPerSentence - 24) * 3;
  const paragraphPenalty = Math.max(0, metadata.readability.averageWordsPerParagraph - 90);
  const scanBonus = metadata.readability.scannable ? 10 : 0;
  const lengthPenalty = metadata.length.withinRange ? 0 : 12;

  return clamp(100 - sentencePenalty - paragraphPenalty - lengthPenalty + scanBonus);
}

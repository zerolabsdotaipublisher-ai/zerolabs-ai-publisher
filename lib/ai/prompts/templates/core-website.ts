import type { WebsiteGenerationInput } from "../types";

interface CoreTemplateArgs {
  input: WebsiteGenerationInput;
  toneGuidance: string;
  styleGuidance: string;
  readabilityRules: string[];
  guardrails: string;
  outputContract: string;
}

function toBulletList(items: string[]): string {
  return items.map((item) => `- ${item}`).join("\n");
}

export function createCoreWebsiteTemplate({
  input,
  toneGuidance,
  styleGuidance,
  readabilityRules,
  guardrails,
  outputContract,
}: CoreTemplateArgs): string {
  return [
    "You are generating website copy for Zero Labs AI Publisher.",
    "Task: produce structured, render-ready website content in strict JSON.",
    "",
    "INPUT",
    `- websiteType: ${input.websiteType}`,
    `- brandName: ${input.brandName}`,
    `- description: ${input.description}`,
    `- targetAudience: ${input.targetAudience}`,
    `- services: ${input.services.join(" | ")}`,
    `- primaryCta: ${input.primaryCta}`,
    "",
    "TONE",
    `- ${toneGuidance}`,
    "STYLE",
    `- ${styleGuidance}`,
    "READABILITY RULES",
    toBulletList(readabilityRules),
    "",
    "GUARDRAILS",
    guardrails,
    "",
    "OUTPUT CONTRACT (example shape)",
    outputContract,
    "",
    "Return JSON only. Do not wrap with markdown fences.",
  ].join("\n");
}

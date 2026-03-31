export const PROMPT_GUARDRAILS: string[] = [
  "Do not invent facts that were not provided in input.",
  "Do not fabricate testimonials if no testimonials are supplied.",
  "Only include sections requested by the prompt workflow.",
  "Preserve user-provided facts exactly when reused.",
  "Keep copy concise, specific, and website-appropriate.",
  "Avoid filler, gibberish, or TODO placeholders.",
  "Avoid unsafe, discriminatory, or off-brand language.",
  "Return machine-readable JSON only when JSON output is requested.",
];

export function guardrailBlock(extraGuardrails: string[] = []): string {
  const lines = [...PROMPT_GUARDRAILS, ...extraGuardrails].map(
    (rule, index) => `${index + 1}. ${rule}`,
  );

  return lines.join("\n");
}

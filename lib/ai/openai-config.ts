import { config } from "@/config";

function isPlaceholderValue(value: string): boolean {
  const normalized = value.trim().toLowerCase();

  return (
    !normalized ||
    normalized.includes("your_openai") ||
    normalized.includes("replace_with") ||
    normalized === "changeme"
  );
}

export function assertOpenAiGenerationConfig(): void {
  if (isPlaceholderValue(config.services.openai.apiKey)) {
    throw new Error("OpenAI API key is missing or invalid.");
  }

  if (isPlaceholderValue(config.services.openai.model)) {
    throw new Error("OpenAI model is missing or invalid.");
  }
}

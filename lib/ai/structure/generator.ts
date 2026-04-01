/**
 * Website structure generation service.
 *
 * This service orchestrates the full AI → structure pipeline:
 *   1. Build the prompt from the user's input (Story 3-1 prompt system).
 *   2. Call the OpenAI Chat Completions API via native fetch (no SDK).
 *   3. Parse and validate the JSON response.
 *   4. Apply fallbacks for any absent or unparseable fields.
 *   5. Map the AI output to a typed WebsiteStructure.
 *   6. Run structure validation.
 *   7. Return a StructureGenerationResult.
 *
 * Config access is via @/config — no raw process.env is used here.
 * Logging is via @/lib/observability.
 */

import { config } from "@/config";
import { logger } from "@/lib/observability";
import { buildWebsitePrompt } from "../prompts";
import { hasMinimumRenderableShape } from "../prompts/evaluation";
import type {
  WebsiteGenerationInput,
  WebsiteGenerationOutput,
} from "../prompts/types";
import { applyFallbacks, needsFallback } from "./fallback";
import { mapOutputToStructure } from "./mapper";
import { validateWebsiteStructure } from "./schemas";
import type { WebsiteStructure, StructureGenerationResult } from "./types";

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function generateStructureId(): string {
  const ts = Date.now().toString(36);
  const rnd = Math.random().toString(36).slice(2, 10);
  return `ws_${ts}_${rnd}`;
}

// ---------------------------------------------------------------------------
// OpenAI caller
// ---------------------------------------------------------------------------

interface OpenAIChatResponse {
  choices: Array<{
    message: {
      content: string | null;
    };
  }>;
}

/**
 * Call the OpenAI Chat Completions API and return the raw response text.
 * Uses config.services.openai for API key and model — never reads process.env.
 */
async function callOpenAI(prompt: string): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.services.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.services.openai.model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as OpenAIChatResponse;
  const content = data.choices[0]?.message?.content;

  if (!content) {
    throw new Error("OpenAI returned an empty response");
  }

  return content;
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

/**
 * Parse a raw OpenAI response string as JSON.
 * Handles responses that are either bare JSON or wrapped in markdown fences.
 * Returns an empty object on parse failure so the fallback path handles it.
 */
function parseOutputJson(raw: string): Partial<WebsiteGenerationOutput> {
  const bare = raw.trim();

  // Try direct parse first.
  try {
    return JSON.parse(bare) as Partial<WebsiteGenerationOutput>;
  } catch {
    // Fall through to markdown fence extraction.
  }

  // Extract from ```json ... ``` or ``` ... ``` blocks.
  const fenceMatch = bare.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch?.[1]) {
    try {
      return JSON.parse(fenceMatch[1]) as Partial<WebsiteGenerationOutput>;
    } catch {
      // Fall through.
    }
  }

  logger.warn("Failed to parse OpenAI output as JSON — applying full fallback", {
    category: "service_call",
    service: "openai",
  });

  return {};
}

// ---------------------------------------------------------------------------
// Public service
// ---------------------------------------------------------------------------

/**
 * Generate a website structure from user input.
 *
 * Calls OpenAI, parses and validates the response, applies fallbacks, maps
 * the result to a typed WebsiteStructure, and returns a
 * StructureGenerationResult with validation metadata.
 */
export async function generateWebsiteStructure(
  input: WebsiteGenerationInput,
  userId: string,
): Promise<StructureGenerationResult> {
  logger.info("Starting website structure generation", {
    category: "service_call",
    service: "openai",
    websiteType: input.websiteType,
  });

  const prompt = buildWebsitePrompt(input);
  const rawText = await callOpenAI(prompt);
  const partial = parseOutputJson(rawText);

  const usedFallback =
    !hasMinimumRenderableShape(partial) || needsFallback(partial);

  if (usedFallback) {
    logger.warn("AI output is incomplete — fallbacks applied", {
      category: "service_call",
      service: "openai",
      websiteType: input.websiteType,
    });
  }

  const output = applyFallbacks(partial, input.websiteType, input.brandName);

  const id = generateStructureId();
  const now = new Date().toISOString();

  const structure: WebsiteStructure = mapOutputToStructure(
    output,
    userId,
    input,
    id,
    now,
  );

  const validationErrors = validateWebsiteStructure(structure);

  if (validationErrors.length > 0) {
    logger.warn("Generated structure has validation errors", {
      category: "service_call",
      service: "openai",
      structureId: id,
      errorCount: validationErrors.length,
    });
  } else {
    logger.info("Website structure generated successfully", {
      category: "service_call",
      service: "openai",
      structureId: id,
      websiteType: output.websiteType,
      usedFallback,
    });
  }

  return { structure, validationErrors, usedFallback };
}

/**
 * Regeneration and update logic.
 *
 * Provides helpers for re-running structure generation on an existing record.
 * The regeneration path preserves the original `id` and `generatedAt`,
 * increments the `version`, and updates `updatedAt`.
 *
 * Callers can optionally supply updated input fields to change the generation
 * parameters (e.g. updated brand description or tone).
 */

import type { WebsiteGenerationInput } from "../prompts/types";
import { generateWebsiteStructure } from "./generator";
import type { WebsiteStructure, StructureGenerationResult } from "./types";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Regenerate a website structure, preserving its identity (`id`, `generatedAt`)
 * and incrementing its version counter.
 *
 * @param existing      - The stored structure to regenerate.
 * @param userId        - Authenticated user ID (must match existing.userId).
 * @param updatedInput  - Optional partial input overrides.  Any fields provided
 *                        here override the original `sourceInput`; all other
 *                        fields are inherited from the original.
 */
export async function regenerateWebsiteStructure(
  existing: WebsiteStructure,
  userId: string,
  updatedInput?: Partial<WebsiteGenerationInput>,
): Promise<StructureGenerationResult> {
  const mergedInput: WebsiteGenerationInput = {
    ...existing.sourceInput,
    ...updatedInput,
  };

  const result = await generateWebsiteStructure(mergedInput, userId);

  // Preserve identity and bump version.
  const regenerated: WebsiteStructure = {
    ...result.structure,
    id: existing.id,
    version: existing.version + 1,
    generatedAt: existing.generatedAt,
    updatedAt: new Date().toISOString(),
  };

  return {
    ...result,
    structure: regenerated,
  };
}

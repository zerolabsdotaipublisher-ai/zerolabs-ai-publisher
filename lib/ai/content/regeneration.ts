import type { WebsiteGenerationInput } from "../prompts/types";
import type { WebsiteStructure } from "../structure/types";
import { generateWebsiteContent } from "./service";
import type { ContentGenerationOptions, ContentGenerationResult } from "./types";

export async function regenerateWebsiteContent(
  existingStructure: WebsiteStructure,
  userId: string,
  updatedInput?: Partial<WebsiteGenerationInput>,
  options?: ContentGenerationOptions,
): Promise<ContentGenerationResult> {
  const mergedInput: WebsiteGenerationInput = {
    ...existingStructure.sourceInput,
    ...updatedInput,
  };

  const result = await generateWebsiteContent(
    mergedInput,
    existingStructure,
    userId,
    options,
  );

  return {
    ...result,
    content: {
      ...result.content,
      version: (result.content.version ?? 1) + 1,
      updatedAt: new Date().toISOString(),
      generatedFromInput: mergedInput,
    },
    mappedStructure: {
      ...result.mappedStructure,
      version: existingStructure.version + 1,
      updatedAt: new Date().toISOString(),
      sourceInput: mergedInput,
    },
  };
}

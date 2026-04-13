import type { WebsiteStructure } from "@/lib/ai/structure";

export function updateWebsiteMetadata(
  structure: WebsiteStructure,
  params: { title: string; description?: string; now: string },
): WebsiteStructure {
  const normalizedTitle = params.title.trim();
  const normalizedDescription = params.description?.trim();

  return {
    ...structure,
    siteTitle: normalizedTitle,
    tagline: normalizedDescription || structure.tagline,
    updatedAt: params.now,
    sourceInput: {
      ...structure.sourceInput,
      brandName: normalizedTitle,
      description: normalizedDescription || structure.sourceInput.description,
    },
    management: {
      ...structure.management,
      displayName: normalizedTitle,
      description: normalizedDescription,
      deletionState: structure.management?.deletedAt ? "deleted" : "active",
    },
  };
}

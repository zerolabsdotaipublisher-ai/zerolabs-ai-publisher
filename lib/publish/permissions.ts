import type { WebsiteStructure } from "@/lib/ai/structure";

export function canUserPublishWebsite(structure: WebsiteStructure, userId: string): boolean {
  return structure.userId === userId;
}

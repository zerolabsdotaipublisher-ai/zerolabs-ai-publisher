import type { WebsiteContentPackage } from "@/lib/ai/content";
import type { WebsiteSeoPackage } from "@/lib/ai/seo";
import type { WebsiteStructure } from "@/lib/ai/structure";
import type { GeneratedArticle } from "@/lib/article";
import type { GeneratedBlogPost } from "@/lib/blog";
import type { ContentSchedule } from "@/lib/scheduling";
import type { WebsiteVersionRecord } from "@/lib/versions";

export type GeneratedContentLifecycleStatus =
  | "draft"
  | "generated"
  | "edited"
  | "scheduled"
  | "published"
  | "archived"
  | "deleted";

export interface GeneratedContentBundle {
  structure: WebsiteStructure;
  generatedContent: WebsiteContentPackage | null;
  seo: WebsiteSeoPackage | null;
  blog: GeneratedBlogPost | null;
  article: GeneratedArticle | null;
  schedule: ContentSchedule | null;
  versions: WebsiteVersionRecord[];
  status: GeneratedContentLifecycleStatus;
}

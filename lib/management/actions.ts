import type { PublishAction, PublishMutationResponse } from "@/lib/publish";

export type WebsiteMutationAction = "rename" | "delete" | "status" | "publish" | "publish_updates";

export type WebsiteNavigationAction = "manage" | "preview" | "edit" | "settings";

export type WebsiteFutureAction = "duplicate";

export type WebsiteManagementActionId = WebsiteMutationAction | WebsiteNavigationAction | WebsiteFutureAction;

export interface WebsiteActionResult {
  ok: boolean;
  error?: string;
  message?: string;
}

export function toPublishActionId(action: PublishAction): Extract<WebsiteMutationAction, "publish" | "publish_updates"> {
  return action === "publish" ? "publish" : "publish_updates";
}

export function getPublishEndpoint(action: PublishAction): "/api/publish" | "/api/publish/update" {
  return action === "publish" ? "/api/publish" : "/api/publish/update";
}

export function toWebsiteActionResult(response: PublishMutationResponse): WebsiteActionResult {
  if (!response.ok) {
    return {
      ok: false,
      error: response.error || "Management action failed.",
    };
  }

  return {
    ok: true,
    message: response.message,
  };
}

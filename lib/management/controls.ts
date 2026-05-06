import type { PublishAction } from "@/lib/publish";
import { toPublishActionId, type WebsiteManagementActionId } from "./actions";
import { deriveWebsiteControlPermissions, type WebsiteControlPermissions } from "./permissions";
import type { WebsiteManagementRecord } from "./types";

export interface WebsiteControlRuntimeState {
  deleting?: boolean;
  renaming?: boolean;
  publishing?: boolean;
  statusUpdating?: boolean;
}

export interface WebsiteManagementControls {
  permissions: WebsiteControlPermissions;
  disabledByActivity: boolean;
  publishAction?: {
    id: WebsiteManagementActionId;
    action: PublishAction;
    label: string;
    disabled: boolean;
    reason?: string;
    requireConfirmation: boolean;
  };
  statusAction?: {
    label: "Archive" | "Activate";
    nextStatus: "archive" | "activate";
    disabled: boolean;
  };
}

export function resolveWebsiteManagementControls(
  website: WebsiteManagementRecord,
  runtime: WebsiteControlRuntimeState,
  options: { currentUserId?: string } = {},
): WebsiteManagementControls {
  const permissions = deriveWebsiteControlPermissions(website, options);
  const disabledByActivity = Boolean(runtime.deleting || runtime.renaming || runtime.publishing || runtime.statusUpdating);
  const publishAction = website.publishStatus.action.publishAction;
  const canShowPublish = publishAction === "publish" || website.publishStatus.hasUnpublishedChanges;
  const blockedByActivity = disabledByActivity;
  const blockedByTransition = website.publishStatus.isTransitional;
  const blockedByPublishState = !website.publishStatus.action.canTriggerPublishAction;
  const blockedByPermission = publishAction === "publish" ? !permissions.canPublish : !permissions.canPublishUpdates;
  const publishDisabled = blockedByActivity || blockedByTransition || blockedByPublishState || blockedByPermission;

  return {
    permissions,
    disabledByActivity,
    publishAction: canShowPublish
      ? {
          id: toPublishActionId(publishAction),
          action: publishAction,
          label: publishAction === "publish" ? "Publish" : "Publish updates",
          disabled: publishDisabled,
          reason: website.publishStatus.action.disableReason
            || (website.publishStatus.isTransitional ? "A publish action is already in progress." : undefined),
          requireConfirmation: true,
        }
      : undefined,
    statusAction: permissions.canArchive
      ? {
          label: "Archive",
          nextStatus: "archive",
          disabled: disabledByActivity,
        }
      : permissions.canActivate
        ? {
            label: "Activate",
            nextStatus: "activate",
            disabled: disabledByActivity,
          }
        : undefined,
  };
}

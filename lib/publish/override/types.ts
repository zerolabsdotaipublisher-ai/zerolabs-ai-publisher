import type { User } from "@supabase/supabase-js";
import type { PublishMutationResponse } from "@/lib/publish/types";

export type ManualOverrideTargetType = "website" | "website_page" | "blog_post" | "article" | "social_post";

export type ManualOverrideScenario = "urgent_publish" | "hotfix_update" | "bypass_scheduled_time" | "bypass_approval";

export type ManualOverrideBypassedWorkflow = "approval" | "schedule";

export type ManualOverridePrincipalRole = "owner" | "admin" | "authorized_approver";

export interface ManualOverrideRequestInput {
  structureId?: string;
  contentId?: string;
  socialPostId?: string;
  targetContentId?: string;
  targetContentType?: ManualOverrideTargetType;
  reason: string;
  scenario: ManualOverrideScenario;
  bypassApproval?: boolean;
}

export interface ManualOverrideParsedInput {
  structureId?: string;
  contentId?: string;
  socialPostId?: string;
  targetContentId?: string;
  targetContentType?: ManualOverrideTargetType;
  reason: string;
  scenario: ManualOverrideScenario;
  bypassApproval: boolean;
}

export interface ManualOverridePermission {
  allowed: boolean;
  canBypassApproval: boolean;
  roles: ManualOverridePrincipalRole[];
  reason?: string;
}

export interface ManualOverrideAuditEntry {
  id: string;
  userId: string;
  overrideUserId: string;
  structureId?: string;
  contentId?: string;
  targetContentId: string;
  targetContentType: ManualOverrideTargetType;
  overrideUsed: boolean;
  overrideReason: string;
  overrideScenario: ManualOverrideScenario;
  overrideTimestamp: string;
  bypassedWorkflows: ManualOverrideBypassedWorkflow[];
  approvalBypassed: boolean;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ManualOverrideExecutionResult {
  ok: boolean;
  requestId: string;
  targetContentId: string;
  targetContentType: ManualOverrideTargetType;
  structureId?: string;
  contentId?: string;
  socialPostId?: string;
  overrideUsed: boolean;
  overrideReason: string;
  overrideTimestamp: string;
  overrideUserId: string;
  scenario: ManualOverrideScenario;
  bypassedWorkflows: ManualOverrideBypassedWorkflow[];
  approvalBypassed: boolean;
  message?: string;
  publish?: PublishMutationResponse;
  social?: {
    ok: boolean;
    jobId: string;
    status: string;
    scheduled: boolean;
  };
  error?: string;
}

export interface ManualOverrideResolvedTarget {
  structureId?: string;
  contentId?: string;
  socialPostId?: string;
  targetContentId: string;
  targetContentType: ManualOverrideTargetType;
  approvalState?: "draft" | "pending_approval" | "approved" | "rejected" | "needs_changes" | "published";
}

export interface ManualOverrideWorkflowParams {
  user: User;
  input: ManualOverrideParsedInput;
}

export interface ManualOverrideStatus {
  canUseOverride: boolean;
  canBypassApproval: boolean;
  reason?: string;
  lastOverride?: {
    overrideUsed: boolean;
    overrideReason: string;
    overrideTimestamp: string;
    overrideUserId: string;
    bypassedWorkflows: ManualOverrideBypassedWorkflow[];
    targetContentId: string;
    targetContentType: ManualOverrideTargetType;
    scenario: ManualOverrideScenario;
    approvalBypassed: boolean;
  };
}

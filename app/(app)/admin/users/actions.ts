"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { logger } from "@/lib/observability";
import { normalizeAdminUserEmailInput, promoteUserToAdminByEmail } from "@/lib/admin/users";
import { requireAdminUser } from "@/lib/supabase/auth";

function redirectToUsersPage(params: Record<string, string | undefined>): never {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  redirect(`${routes.adminUsers}?${searchParams.toString()}`);
}

export async function promoteAdminUserAction(formData: FormData): Promise<void> {
  const requestId = crypto.randomUUID();
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? normalizeAdminUserEmailInput(rawEmail) : "";

  if (!email) {
    redirectToUsersPage({ result: "invalid-email", requestId });
  }

  const { user, isAdmin } = await requireAdminUser();

  if (!user || !isAdmin) {
    logger.warn("Admin promotion rejected because the current user is not authorized", {
      category: "security",
      service: "supabase",
      requestId,
      userId: user?.id,
      targetEmail: email,
      diagnosticCategory: "admin-promotion-unauthorized",
    });

    redirectToUsersPage({ result: "unauthorized", email, requestId });
  }

  let attempt: Awaited<ReturnType<typeof promoteUserToAdminByEmail>>;

  try {
    attempt = await promoteUserToAdminByEmail(email, requestId);

    if (attempt.result.status === "promoted") {
      revalidatePath(routes.adminDashboard);
      revalidatePath(routes.adminDeployments);
      revalidatePath(routes.adminAnalytics);
      revalidatePath(routes.adminUsers);
      revalidatePath(routes.dashboard);
    }
  } catch (error) {
    logger.error("Admin user promotion failed", {
      category: "error",
      service: "supabase",
      requestId,
      userId: user?.id,
      targetEmail: email,
      error: {
        message: error instanceof Error ? error.message : String(error),
        name: "AdminUserPromotionError",
      },
    });

    redirectToUsersPage({ result: "role-update-failed", email, requestId });
  }

  logger.info("Admin user promotion completed", {
    category: attempt.result.status === "promoted" ? "security" : "error",
    service: "supabase",
    requestId,
    userId: user.id,
    targetEmail: attempt.result.email,
    result: attempt.result.status,
    serviceRoleStatus: attempt.diagnostics.serviceRole.status,
    authReadsStatus: attempt.diagnostics.authReads.status,
    profileReadsStatus: attempt.diagnostics.profileReads.status,
    targetExistsInAuth: attempt.diagnostics.targetUser?.existsInAuth ?? undefined,
    targetExistsInProfile: attempt.diagnostics.targetUser?.existsInProfile ?? undefined,
    suspectedIssue: attempt.diagnostics.suspectedIssue,
  });

  redirectToUsersPage({
    result: attempt.result.status,
    email: attempt.result.email,
    requestId,
  });
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { logger } from "@/lib/observability";
import { promoteUserToAdminByEmail } from "@/lib/admin/users";
import { requireAdminAccess } from "@/lib/supabase/auth";

function redirectToUsersPage(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`${routes.adminUsers}?${searchParams.toString()}`);
}

export async function promoteAdminUserAction(formData: FormData): Promise<void> {
  const { user } = await requireAdminAccess(routes.adminUsers);
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";

  if (!email) {
    redirectToUsersPage({ result: "invalid-email" });
  }

  if (user.email?.trim().toLowerCase() === email) {
    redirectToUsersPage({ result: "self-noop", email });
  }

  try {
    const result = await promoteUserToAdminByEmail(email);

    revalidatePath(routes.adminDashboard);
    revalidatePath(routes.adminDeployments);
    revalidatePath(routes.adminAnalytics);
    revalidatePath(routes.adminUsers);
    revalidatePath(routes.dashboard);

    if (result.status === "promoted") {
      redirectToUsersPage({ result: "promoted", email: result.email });
    }

    if (result.status === "already_admin") {
      redirectToUsersPage({ result: "already-admin", email: result.email });
    }

    redirectToUsersPage({ result: "not-found", email });
  } catch (error) {
    logger.error("Admin user promotion failed", {
      category: "error",
      service: "supabase",
      userId: user.id,
      error: {
        message: error instanceof Error ? error.message : String(error),
        name: "AdminUserPromotionError",
      },
    });

    redirectToUsersPage({ result: "failed", email });
  }
}

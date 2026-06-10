"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { logger } from "@/lib/observability";
import { normalizeAdminUserEmailInput, promoteUserToAdminByEmail } from "@/lib/admin/users";
import { requireAdminUser } from "@/lib/supabase/auth";

function redirectToUsersPage(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`${routes.adminUsers}?${searchParams.toString()}`);
}

export async function promoteAdminUserAction(formData: FormData): Promise<void> {
  const rawEmail = formData.get("email");
  const email = typeof rawEmail === "string" ? normalizeAdminUserEmailInput(rawEmail) : "";

  if (!email) {
    redirectToUsersPage({ result: "invalid-email" });
  }

  const { user, isAdmin } = await requireAdminUser();

  if (!user || !isAdmin) {
    redirectToUsersPage({ result: "unauthorized", email });
  }

  let result: Awaited<ReturnType<typeof promoteUserToAdminByEmail>>;

  try {
    result = await promoteUserToAdminByEmail(email);

    if (result.status === "promoted") {
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
      userId: user?.id,
      error: {
        message: error instanceof Error ? error.message : String(error),
        name: "AdminUserPromotionError",
      },
    });

    redirectToUsersPage({ result: "failed", email });
  }

  if (result.status === "promoted") {
    redirectToUsersPage({ result: "promoted", email: result.email });
  }

  if (result.status === "already_admin") {
    redirectToUsersPage({ result: "already-admin", email: result.email });
  }

  redirectToUsersPage({ result: "no-user", email: result.email });
}

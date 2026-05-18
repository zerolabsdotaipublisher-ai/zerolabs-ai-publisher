import { AdminFallback } from "@/components/admin/admin-fallback";
import { routes } from "@/config/routes";
import { logger } from "@/lib/observability";
import { requireAdminUser } from "@/lib/supabase/auth";

export const dynamic = "force-dynamic";

async function loadAdminIndexPage() {
  try {
    const { user, isAdmin } = await requireAdminUser();

    return {
      userEmail: user?.email,
      retryHref: isAdmin ? routes.adminDashboard : routes.admin,
      description: isAdmin
        ? "Open the admin dashboard manually from here to keep the main dashboard route stable."
        : "Admin access is unavailable for this session, so the stable fallback view is being shown.",
    };
  } catch (error) {
    logger.error("AdminIndexPage fell back to admin fallback UI", {
      category: "error",
      service: "dashboard",
      error: { message: error instanceof Error ? error.message : String(error), name: "AdminIndexRenderError" },
    });

    return {
      retryHref: routes.admin,
    };
  }
}

export default async function AdminIndexPage() {
  const result = await loadAdminIndexPage();

  return (
    <AdminFallback
      userEmail={result.userEmail}
      retryHref={result.retryHref}
      description={result.description}
    />
  );
}

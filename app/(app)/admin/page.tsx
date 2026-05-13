import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { requireAdminUser } from "@/lib/supabase/auth";

export default async function AdminIndexPage() {
  await requireAdminUser(routes.adminDashboard);
  redirect(routes.adminDashboard);
}

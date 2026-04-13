import { routes } from "@/config/routes";
import { WebsiteManagementShell } from "@/components/management/website-management-shell";
import { listManagedWebsites } from "@/lib/management";
import { requireUser } from "@/lib/supabase/auth";

export default async function WebsitesPage() {
  const user = await requireUser(routes.websites);
  const websites = await listManagedWebsites(user.id, {
    status: "all",
    includeDeleted: false,
  });

  return <WebsiteManagementShell initialWebsites={websites} />;
}

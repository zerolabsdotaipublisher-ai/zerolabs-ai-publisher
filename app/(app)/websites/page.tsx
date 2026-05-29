import { routes } from "@/config/routes";
import { WebsiteManagementShell } from "@/components/management/website-management-shell";
import { listManagedWebsitesPage } from "@/lib/management";
import { requireUser } from "@/lib/supabase/auth";

export default async function WebsitesPage() {
  const user = await requireUser(routes.websites);
  const initialListing = await listManagedWebsitesPage(user.id, {
    status: "all",
    includeDeleted: false,
    page: 1,
    perPage: 12,
  });

  return <WebsiteManagementShell initialListing={initialListing} currentUserId={user.id} />;
}

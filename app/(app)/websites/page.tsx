import { routes } from "@/config/routes";
import { WebsiteManagementShell } from "@/components/management/website-management-shell";
import { listManagedWebsitesPage } from "@/lib/management";
import type { WebsiteStatusFilter } from "@/lib/management";
import { requireUser } from "@/lib/supabase/auth";

interface WebsitesPageProps {
  searchParams?: Promise<{ status?: string }>;
}

function parseStatus(value?: string): WebsiteStatusFilter {
  return value === "draft" ? "draft" : "all";
}

export default async function WebsitesPage({ searchParams }: WebsitesPageProps) {
  const user = await requireUser(routes.websites);
  const status = parseStatus((await searchParams)?.status);
  const initialListing = await listManagedWebsitesPage(user.id, {
    status,
    includeDeleted: false,
    page: 1,
    perPage: 12,
  });

  return <WebsiteManagementShell initialListing={initialListing} initialStatus={status} currentUserId={user.id} />;
}

import { ApprovalShell } from "@/components/approval/approval-shell";
import { routes } from "@/config/routes";
import { listOwnedApprovalPage, parseApprovalQuery } from "@/lib/approval";
import { requireUser } from "@/lib/supabase/auth";

interface PageProps {
  searchParams?: Promise<Record<string, string | undefined>>;
}

export default async function ApprovalPage({ searchParams }: PageProps) {
  const user = await requireUser(routes.approval);
  const queryParams = searchParams ? await searchParams : undefined;
  const params = new URLSearchParams();

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (typeof value === "string") {
        params.set(key, value);
      }
    });
  }

  const query = parseApprovalQuery(params);
  const initialPage = await listOwnedApprovalPage(user.id, query);

  return <ApprovalShell initialPage={initialPage} initialQuery={query} />;
}

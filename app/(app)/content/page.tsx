import { routes } from "@/config/routes";
import { ContentLibraryShell } from "@/components/content-library/content-library-shell";
import { listOwnedContentLibraryPage } from "@/lib/content/library";
import { requireUser } from "@/lib/supabase/auth";

export default async function ContentLibraryPage() {
  const user = await requireUser(routes.contentLibrary);

  const initialPage = await listOwnedContentLibraryPage(user.id, {
    page: 1,
    perPage: 12,
    type: "all",
    status: "all",
    websiteId: "all",
    sort: "updated_desc",
    search: undefined,
  });

  return <ContentLibraryShell initialPage={initialPage} />;
}

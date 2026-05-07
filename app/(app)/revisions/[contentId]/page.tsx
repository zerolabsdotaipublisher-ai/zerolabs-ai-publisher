import { notFound } from "next/navigation";
import { RevisionHistoryShell } from "@/components/revisions/revision-history-shell";
import { routes } from "@/config/routes";
import { listOwnedRevisionHistory, normalizeRevisionContentIdParam } from "@/lib/revisions";
import { requireUser } from "@/lib/supabase/auth";

interface PageProps {
  params: Promise<{ contentId: string }>;
}

export default async function RevisionHistoryPage({ params }: PageProps) {
  const { contentId: rawContentId } = await params;
  const contentId = normalizeRevisionContentIdParam(rawContentId);
  const user = await requireUser(routes.revisionItem(contentId));

  const result = await listOwnedRevisionHistory(user.id, contentId);
  if (!result.ok) {
    notFound();
  }

  return (
    <RevisionHistoryShell
      contentId={contentId}
      initialEntries={result.revisions.entries}
      scenarios={result.scenarios}
      mvpBoundaries={result.mvpBoundaries}
    />
  );
}

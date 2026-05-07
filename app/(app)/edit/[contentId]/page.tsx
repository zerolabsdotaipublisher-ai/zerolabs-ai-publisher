import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { ContentEditorShell } from "@/components/editing/content-editor-shell";
import { getOwnedEditingWorkflowState, normalizeEditingContentIdParam } from "@/lib/editing";
import { requireUser } from "@/lib/supabase/auth";

interface PageProps {
  params: Promise<{ contentId: string }>;
}

export default async function EditContentPage({ params }: PageProps) {
  const { contentId: rawContentId } = await params;
  const contentId = normalizeEditingContentIdParam(rawContentId);
  const user = await requireUser(routes.editContent(contentId));
  const detail = await getOwnedEditingWorkflowState(user.id, contentId);

  if (!detail) {
    notFound();
  }

  return <ContentEditorShell initialDetail={detail} />;
}

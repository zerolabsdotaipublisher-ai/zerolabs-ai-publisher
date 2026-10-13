import { notFound } from "next/navigation";
import { VisualEditorShell } from "@/components/visual-editor/visual-editor-shell";
import { routes } from "@/config/routes";
import {
  adaptWebsiteStructureToEditorDocument,
  getEditorDocumentProjectabilityIssues,
  trustedWebsiteStructureState,
} from "@/lib/editor/document";
import { getWebsiteStructure } from "@/lib/ai/structure";
import { requireUser } from "@/lib/supabase/auth";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

/**
 * An intentionally separate, draft-only route. The established production
 * editor remains at /editor/[id] until atomic canonical-document persistence
 * has passed its safety gate.
 */
export default async function VisualWebsiteEditorPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { page: requestedPath } = await searchParams;
  const user = await requireUser(routes.editorVisual(id));
  const structure = await getWebsiteStructure(id, user.id);

  if (!structure || structure.management?.deletedAt) notFound();

  const document = adaptWebsiteStructureToEditorDocument(structure);
  const selectedPageId = requestedPath ? document.pages.find((page) => page.path === requestedPath)?.id : undefined;

  return (
    <VisualEditorShell
      initialDocument={document}
      initialPageId={selectedPageId}
      projectabilityIssues={getEditorDocumentProjectabilityIssues(document, trustedWebsiteStructureState(structure))}
    />
  );
}

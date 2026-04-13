import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { WebsiteEditorShell } from "@/components/editor/website-editor-shell";
import { getWebsiteStructure } from "@/lib/ai/structure";
import { requireUser } from "@/lib/supabase/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WebsiteEditorPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser(routes.editorSite(id));
  const structure = await getWebsiteStructure(id, user.id);

  if (!structure || structure.management?.deletedAt) {
    notFound();
  }

  return (
    <WebsiteEditorShell
      initialStructure={structure}
      previewPath={routes.previewSite(id)}
      generatedSitePath={routes.generatedSite(id)}
    />
  );
}

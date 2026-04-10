import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { WebsitePreviewShell } from "@/components/preview/website-preview-shell";
import { createPreviewModel } from "@/lib/preview/model";
import { PREVIEW_QUERY_KEYS } from "@/lib/preview/state";
import { getOwnedPreviewStructure } from "@/lib/preview/security";
import { requireUser } from "@/lib/supabase/auth";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}

export default async function WebsitePreviewPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const user = await requireUser(routes.previewSite(id));
  const query = searchParams ? await searchParams : undefined;
  const structure = await getOwnedPreviewStructure(id, user.id);

  if (!structure) {
    notFound();
  }

  const model = createPreviewModel({
    structure,
    pageSlug: query?.[PREVIEW_QUERY_KEYS.page],
    deviceMode: query?.[PREVIEW_QUERY_KEYS.device],
    refreshKey: query?.[PREVIEW_QUERY_KEYS.refresh],
    accessLevel: "owner",
  });

  return <WebsitePreviewShell model={model} />;
}

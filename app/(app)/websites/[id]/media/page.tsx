import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { WebsiteMediaLibraryShell } from "@/components/website-media-library/website-media-library-shell";
import { getWebsiteStructure } from "@/lib/ai/structure";
import { requireUser } from "@/lib/supabase/auth";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WebsiteMediaLibraryPage({ params }: PageProps) {
  const { id } = await params;
  const user = await requireUser(routes.websiteMediaLibrary(id));
  const structure = await getWebsiteStructure(id, user.id);

  if (!structure || structure.management?.deletedAt) {
    notFound();
  }

  return <WebsiteMediaLibraryShell websiteId={structure.id} linkedContentId={`website:${structure.id}`} linkedContentType="website" />;
}

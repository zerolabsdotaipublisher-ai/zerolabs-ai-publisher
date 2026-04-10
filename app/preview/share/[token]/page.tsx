import { notFound } from "next/navigation";
import { WebsitePreviewShell } from "@/components/preview/website-preview-shell";
import { createPreviewModel } from "@/lib/preview/model";
import { PREVIEW_QUERY_KEYS } from "@/lib/preview/state";
import { resolveSharedPreviewAccess } from "@/lib/preview/security";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}

export default async function SharedWebsitePreviewPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const query = searchParams ? await searchParams : undefined;
  const access = await resolveSharedPreviewAccess(token);

  if (!access) {
    notFound();
  }

  const model = createPreviewModel({
    structure: access.structure,
    pageSlug: query?.[PREVIEW_QUERY_KEYS.page],
    deviceMode: query?.[PREVIEW_QUERY_KEYS.device],
    refreshKey: query?.[PREVIEW_QUERY_KEYS.refresh],
    accessLevel: "shared",
    sharedPreviewPath: `/preview/share/${token}`,
    sharedPreviewExpiresAt: access.expiresAt,
  });

  return <WebsitePreviewShell model={model} />;
}

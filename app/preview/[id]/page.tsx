import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { WebsitePreviewShell } from "@/components/preview/website-preview-shell";
import { createRequestId, logger } from "@/lib/observability";
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
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? createRequestId();
  const user = await requireUser(routes.previewSite(id));
  const query = searchParams ? await searchParams : undefined;
  const structure = await getOwnedPreviewStructure(id, user.id, requestId);

  if (!structure) {
    logger.warn("Preview route could not resolve a usable structure", {
      category: "error",
      service: "preview",
      failedStage: "preview-load",
      safeErrorCategory: "preview-structure-unavailable",
      requestId,
      structureId: id,
      userId: user.id,
      accessLevel: "owner",
    });
    notFound();
  }

  const model = (() => {
    try {
      return createPreviewModel({
        structure,
        pageSlug: query?.[PREVIEW_QUERY_KEYS.page],
        deviceMode: query?.[PREVIEW_QUERY_KEYS.device],
        refreshKey: query?.[PREVIEW_QUERY_KEYS.refresh],
        accessLevel: "owner",
      });
    } catch (error) {
      logger.error("Preview model creation failed", {
        category: "error",
        service: "preview",
        failedStage: "preview-parse",
        safeErrorCategory: "preview-model-invalid",
        requestId,
        structureId: id,
        userId: user.id,
        accessLevel: "owner",
        error: {
          name: "PreviewModelError",
          message: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  })();

  return <WebsitePreviewShell model={model} requestId={requestId} />;
}

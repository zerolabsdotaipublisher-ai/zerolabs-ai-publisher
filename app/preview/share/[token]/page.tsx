import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { WebsitePreviewShell } from "@/components/preview/website-preview-shell";
import { createRequestId, logger } from "@/lib/observability";
import { createPreviewModel } from "@/lib/preview/model";
import { verifyPreviewShareToken } from "@/lib/preview/sharing";
import { PREVIEW_QUERY_KEYS } from "@/lib/preview/state";
import { resolveSharedPreviewAccess } from "@/lib/preview/security";
import { withWebsiteAssetQueryContext } from "@/lib/website-asset-retrieval";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams?: Promise<Record<string, string | undefined>>;
}

export default async function SharedWebsitePreviewPage({ params, searchParams }: PageProps) {
  const { token } = await params;
  const requestHeaders = await headers();
  const requestId = requestHeaders.get("x-request-id") ?? createRequestId();
  const tokenPayload = verifyPreviewShareToken(token);
  const query = searchParams ? await searchParams : undefined;
  const access = await resolveSharedPreviewAccess(token, requestId);

  if (!access) {
    logger.warn("Shared preview route could not resolve a usable structure", {
      category: "error",
      service: "preview",
      failedStage: "preview-load",
      safeErrorCategory: "preview-structure-unavailable",
      requestId,
      structureId: tokenPayload?.sid,
      hasPreviewToken: Boolean(token),
      accessLevel: "shared",
    });
    notFound();
  }

  const model = (() => {
    try {
      return createPreviewModel({
        structure: withWebsiteAssetQueryContext(access.structure, { previewToken: token }),
        pageSlug: query?.[PREVIEW_QUERY_KEYS.page],
        deviceMode: query?.[PREVIEW_QUERY_KEYS.device],
        refreshKey: query?.[PREVIEW_QUERY_KEYS.refresh],
        accessLevel: "shared",
        sharedPreviewPath: `/preview/share/${token}`,
        sharedPreviewExpiresAt: access.expiresAt,
      });
    } catch (error) {
      logger.error("Shared preview model creation failed", {
        category: "error",
        service: "preview",
        failedStage: "preview-parse",
        safeErrorCategory: "preview-model-invalid",
        requestId,
        hasPreviewToken: Boolean(token),
        structureId: access.structure.id,
        accessLevel: "shared",
        error: {
          name: "SharedPreviewModelError",
          message: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  })();

  return <WebsitePreviewShell model={model} requestId={requestId} />;
}

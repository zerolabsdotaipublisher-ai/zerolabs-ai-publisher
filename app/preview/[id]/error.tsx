"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { PreviewErrorState } from "@/components/preview/preview-error-state";
import { logPreviewClientDiagnostic } from "@/lib/preview/client-diagnostics";

interface PreviewErrorPageProps {
  error: Error & { digest?: string };
}

export default function PreviewErrorPage({ error }: PreviewErrorPageProps) {
  const params = useParams<{ id?: string }>();

  useEffect(() => {
    logPreviewClientDiagnostic({
      message: "Preview route failed to render",
      failedStage: "preview-render",
      safeErrorCategory: "preview-render-failed",
      routeKind: "owner",
      structureId: params?.id,
      error,
      digest: error.digest,
    });
  }, [error, params]);

  return <PreviewErrorState />;
}
